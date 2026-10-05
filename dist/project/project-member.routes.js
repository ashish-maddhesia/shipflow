import { Router } from "express";
import { requireAuth, } from "../auth/auth.middleware.js";
import { addProjectMember, getProjectMembers, } from "./project-member.service.js";
import { requireProjectRole, } from "./project-auth.middleware.js";
const router = Router();
// Add a member to a project
router.post("/projects/:projectId/members", requireAuth, requireProjectRole("ADMIN", "MANAGER"), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const projectId = req.params.projectId;
        const { userId, role } = req.body;
        if (!userId || !role) {
            return res.status(400).json({
                message: "userId and role are required",
            });
        }
        const member = await addProjectMember(projectId, userId, role);
        return res.status(201).json({
            message: "Project member added successfully",
            member,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error instanceof Error
                ? error.message
                : "Failed to add project member",
        });
    }
});
// Get project members
router.get("/projects/:projectId/members", requireAuth, requireProjectRole("ADMIN", "MANAGER"), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const projectId = req.params.projectId;
        const members = await getProjectMembers(projectId);
        return res.json({
            members,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Failed to fetch project members",
        });
    }
});
export default router;
