import { Router } from "express";

import {
  requireAuth,
  AuthRequest,
} from "../auth/auth.middleware.js";

import {
  createService,
  getProjectServices,
  getServiceById,
  updateService,
  deleteService,
} from "./service.service.js";

import {
  requireServiceProjectRole,
} from "./service-auth.middleware.js";
import {
  requireProjectRole,
} from "./project-auth.middleware.js";

const router = Router();

/*
 * Create a service
 * POST /projects/:projectId/services
 */
router.post(
  "/projects/:projectId/services",
  requireAuth,
  requireProjectRole("ADMIN", "MANAGER"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const projectId =
        req.params.projectId as string;

      const {
        name,
        slug,
        description,
        repositoryUrl,
        branch,
      } = req.body;

      if (!name || !slug) {
        return res.status(400).json({
          message: "name and slug are required",
        });
      }

      const service = await createService(
        projectId,
        name,
        slug,
        description,
        repositoryUrl,
        branch
      );

      return res.status(201).json({
        message: "Service created successfully",
        service,
      });
    } catch (error) {
      console.error("Create service error:", error);

      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to create service",
      });
    }
  }
);

/*
 * Get all services of a project
 * GET /projects/:projectId/services
 */

router.get(
  "/projects/:projectId/services",
  requireAuth,
  requireProjectRole(
    "ADMIN",
    "MANAGER",
    "DEVELOPER",
    "DEVOPS_ENGINEER",
    "VIEWER"
  ),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const projectId =
        req.params.projectId as string;

      const services =
        await getProjectServices(projectId);

      return res.json({
        services,
      });
    } catch (error) {
      console.error(
        "Get project services error:",
        error
      );

      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch services",
      });
    }
  }
);

/*
 * Get service by ID
 * GET /services/:serviceId
 */

/*
 * Update service
 * PATCH /services/:serviceId
 */
router.patch(
  "/services/:serviceId",
  requireAuth,
  requireServiceProjectRole(
    "ADMIN",
    "MANAGER"
  ),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const serviceId =
        req.params.serviceId as string;

      const {
        name,
        slug,
        description,
        repositoryUrl,
      } = req.body;

      const service = await updateService(
        serviceId,
        {
          name,
          slug,
          description,
          repositoryUrl,
        }
      );

      if (!service) {
        return res.status(404).json({
          message: "Service not found",
        });
      }

      return res.json({
        message: "Service updated successfully",
        service,
      });
    } catch (error) {
      console.error(
        "Update service error:",
        error
      );

      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to update service",
      });
    }
  }
);

/*
 * Delete service
 * DELETE /services/:serviceId
 */
router.delete(
  "/services/:serviceId",
  requireAuth,
  requireServiceProjectRole(
    "ADMIN"
  ),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const serviceId =
        req.params.serviceId as string;

      const service =
        await deleteService(serviceId);

      if (!service) {
        return res.status(404).json({
          message: "Service not found",
        });
      }

      return res.json({
        message: "Service deleted successfully",
        service,
      });
    } catch (error) {
      console.error(
        "Delete service error:",
        error
      );

      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete service",
      });
    }
  }
);
router.get(
  "/services/:serviceId",
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

      const service =
        await getServiceById(serviceId);

      if (!service) {
        return res.status(404).json({
          message: "Service not found",
        });
      }

      return res.json({
        service,
      });
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch service",
      });
    }
  }
);

export default router;