
import { Response, NextFunction } from "express";
import { and, eq } from "drizzle-orm";

import { db } from "../lib/db.js";

import {
  deployments,
  serviceEnvironments,
  services,
  projectMembers,
} from "../db/schema.js";

import {
  AuthRequest,
} from "../auth/auth.middleware.js";

export function requireDeploymentProjectRole(
  ...allowedRoles: string[]
) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const deploymentId =
        req.params.deploymentId as string;

      /*
       * Find the project that owns the deployment.
       *
       * deployment
       *      ↓
       * service_environment
       *      ↓
       * service
       *      ↓
       * project
       */
      const [deployment] = await db
        .select({
          projectId: services.projectId,
        })
        .from(deployments)
        .innerJoin(
          serviceEnvironments,
          eq(
            deployments.serviceEnvironmentId,
            serviceEnvironments.id
          )
        )
        .innerJoin(
          services,
          eq(
            serviceEnvironments.serviceId,
            services.id
          )
        )
        .where(
          eq(
            deployments.id,
            deploymentId
          )
        );

      if (!deployment) {
        return res.status(404).json({
          message: "Deployment not found",
        });
      }

      /*
       * Check whether the authenticated user
       * belongs to the project.
       */
      const [member] = await db
        .select({
          role: projectMembers.role,
        })
        .from(projectMembers)
        .where(
          and(
            eq(
              projectMembers.projectId,
              deployment.projectId
            ),
            eq(
              projectMembers.userId,
              req.user.id
            )
          )
        );

      /*
       * User is not a project member
       * or does not have the required role.
       */
      if (
        !member ||
        !allowedRoles.includes(member.role)
      ) {
        return res.status(403).json({
          message:
            "You do not have permission to perform this action",
        });
      }

      /*
       * Authorization successful.
       */
      next();
    } catch (error) {
      console.error(
        "Deployment authorization error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to authorize deployment action",
      });
    }
  };
}
