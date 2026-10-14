import { Router } from "express";

import {
  requireAuth,
  AuthRequest,
} from "../auth/auth.middleware.js";


import {
  requireServiceProjectRole,
} from "./service-auth.middleware.js";

import {
  createDeployment,
  getServiceDeployments,
  getDeploymentById,
  updateDeploymentStatus,
} from "./deployment.service.js";



const router = Router();

/*
 * Create deployment
 * POST /services/:serviceId/deployments
 */
router.post(
  "/services/:serviceId/deployments",
  requireAuth,
  requireServiceProjectRole(
    "ADMIN",
    "MANAGER",
    "DEVOPS_ENGINEER"
  ),
  async (req: AuthRequest, res) => {
    try {
      const serviceEnvironmentId =
        req.body.serviceEnvironmentId;
      const serverId = req.body.serverId;

      if (
        typeof serviceEnvironmentId !== "string" ||
        !serviceEnvironmentId.trim()
      ) {
        return res.status(400).json({
          message: "serviceEnvironmentId is required",
        });
      }

      if (
        typeof serverId !== "string" ||
        !serverId.trim()
      ) {
        return res.status(400).json({
          message: "serverId is required",
        });
      }

      const deployment = await createDeployment(
        serviceEnvironmentId,
        serverId
      );

      return res.status(201).json({
        message:
          "Deployment created successfully",
        deployment,
      });
    } catch (error) {
      console.error(
        "Create deployment error:",
        error
      );

      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to create deployment",
      });
    }
  }
);

/*
 * Get service deployments
 * GET /services/:serviceId/deployments
 */
router.get(
  "/services/:serviceId/deployments",
  requireAuth,
  requireServiceProjectRole(
    "ADMIN",
    "MANAGER",
    "DEVELOPER",
    "DEVOPS_ENGINEER",
    "VIEWER"
  ),
  async (req: AuthRequest, res) => {
    try {
      const serviceId =
        req.params.serviceId as string;

      const deployments =
        await getServiceDeployments(
          serviceId
        );

      return res.json({
        deployments,
      });
    } catch (error) {
      console.error(
        "Get deployments error:",
        error
      );

      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch deployments",
      });
    }
  }
);

/*
 * Get deployment
 * GET /deployments/:deploymentId
 */
router.get(
  "/deployments/:deploymentId",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const deploymentId =
        req.params.deploymentId as string;

      const deployment =
        await getDeploymentById(
          deploymentId
        );

      if (!deployment) {
        return res.status(404).json({
          message: "Deployment not found",
        });
      }

      return res.json({
        deployment,
      });
    } catch (error) {
      console.error(
        "Get deployment error:",
        error
      );

      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch deployment",
      });
    }
  }
);

/*
 * Update deployment status
 * PATCH /deployments/:deploymentId/status
 */
router.patch(
  "/deployments/:deploymentId/status",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const deploymentId =
        req.params.deploymentId as string;

      const { status } = req.body;

      const allowedStatuses = [
        "PENDING",
        "QUEUED",
        "BUILDING",
        "DEPLOYING",
        "SUCCESS",
        "FAILED",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid deployment status",
        });
      }

      const deployment =
        await updateDeploymentStatus(
          deploymentId,
          status
        );

      if (!deployment) {
        return res.status(404).json({
          message: "Deployment not found",
        });
      }

      return res.json({
        message:
          "Deployment status updated successfully",
        deployment,
      });
    } catch (error) {
      console.error(
        "Update deployment status error:",
        error
      );

      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to update deployment status",
      });
    }
  }
);

export default router;