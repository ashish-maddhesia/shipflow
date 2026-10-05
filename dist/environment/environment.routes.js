import { Router } from "express";
import { requireAuth, } from "../auth/auth.middleware.js";
import { createEnvironment, getEnvironments, } from "./environment.service.js";
const router = Router();
router.post("/projects/:projectId/environments", requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const projectId = req.params.projectId;
        const { name, slug, type, } = req.body;
        if (!name || !slug || !type) {
            return res.status(400).json({
                message: "name, slug and type are required",
            });
        }
        const allowedTypes = [
            "DEVELOPMENT",
            "STAGING",
            "PRODUCTION",
        ];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                message: "Invalid environment type",
            });
        }
        const environment = await createEnvironment(projectId, name.trim(), slug.trim(), type);
        return res.status(201).json({
            message: "Environment created successfully",
            environment,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            message: error instanceof Error
                ? error.message
                : "Failed to create environment",
        });
    }
});
router.get("/projects/:projectId/environments", requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const projectId = req.params.projectId;
        const environments = await getEnvironments(projectId);
        return res.json({
            environments,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Failed to fetch environments",
        });
    }
});
export default router;
