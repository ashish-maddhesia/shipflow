import { Router } from "express";
import { requireAuth, } from "../auth/auth.middleware.js";
import { createProject, getProjects, } from "./project.service.js";
const router = Router();
router.post("/organizations/:organizationId/projects", requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const organizationId = req.params.organizationId;
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Project name is required",
            });
        }
        const project = await createProject(name.trim(), organizationId, req.user.id);
        return res.status(201).json({
            message: "Project created successfully",
            project,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error instanceof Error
                ? error.message
                : "Failed to create project",
        });
    }
});
router.get("/organizations/:organizationId/projects", requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const organizationId = req.params.organizationId;
        const projects = await getProjects(organizationId);
        return res.json({
            projects,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Failed to fetch projects",
        });
    }
});
export default router;
