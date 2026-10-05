import { Router } from "express";

import {
  requireAuth,
  AuthRequest,
} from "../auth/auth.middleware.js";

import {
  requireServiceProjectRole,
} from "./service-auth.middleware.js";

import {
  attachServiceToEnvironment,
  getServiceEnvironments,
  removeServiceFromEnvironment,
} from "./service-environment.service.js";

const router = Router();

/*
 * Attach service to environment
 *
 * POST /services/:serviceId/environments
 */
router.post(
  "/services/:serviceId/environments",
  requireAuth,
  requireServiceProjectRole(
    "ADMIN",
    "MANAGER",
    "DEVOPS_ENGINEER"
  ),
  async (req: AuthRequest, res) => {
    try {
      const serviceId =
        req.params.serviceId as string;

      const { environmentId } = req.body;

      if (!environmentId) {
        return res.status(400).json({
          message: "environmentId is required",
        });
      }

      const serviceEnvironment =
        await attachServiceToEnvironment(
          serviceId,
          environmentId
        );

      return res.status(201).json({
        message:
          "Service attached to environment successfully",
        serviceEnvironment,
      });
    } catch (error) {
      console.error(
        "Attach service environment error:",
        error
      );

      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to attach service to environment",
      });
    }
  }
);

/*
 * Get service environments
 *
 * GET /services/:serviceId/environments
 */
router.get(
  "/services/:serviceId/environments",
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

      const environments =
        await getServiceEnvironments(
          serviceId
        );

      return res.json({
        environments,
      });
    } catch (error) {
      console.error(
        "Get service environments error:",
        error
      );

      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch service environments",
      });
    }
  }
);

/*
 * Remove service from environment
 *
 * DELETE /services/:serviceId/environments/:environmentId
 */
router.delete(
  "/services/:serviceId/environments/:environmentId",
  requireAuth,
  requireServiceProjectRole(
    "ADMIN",
    "MANAGER",
    "DEVOPS_ENGINEER"
  ),
  async (req: AuthRequest, res) => {
    try {
      const serviceId =
        req.params.serviceId as string;

      const environmentId =
        req.params.environmentId as string;

      const deleted =
        await removeServiceFromEnvironment(
          serviceId,
          environmentId
        );

      if (!deleted) {
        return res.status(404).json({
          message:
            "Service environment mapping not found",
        });
      }

      return res.json({
        message:
          "Service detached from environment successfully",
        serviceEnvironment: deleted,
      });
    } catch (error) {
      console.error(
        "Remove service environment error:",
        error
      );

      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove service from environment",
      });
    }
  }
);

export default router;