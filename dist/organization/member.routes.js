import { Router } from "express";
import { requireAuth, } from "../auth/auth.middleware.js";
import { addMember, getMembers, } from "./member.service.js";
const router = Router();
// POST /api/organizations/:organizationId/members
router.post("/:organizationId/members", requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const { organizationId } = req.params;
        const { userId, role } = req.body;
        if (!userId || !role) {
            return res.status(400).json({
                message: "userId and role are required",
            });
        }
        const member = await addMember(organizationId, userId, role);
        return res.status(201).json({
            message: "Member added successfully",
            member,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error instanceof Error
                ? error.message
                : "Failed to add member",
        });
    }
});
// GET /api/organizations/:organizationId/members
router.get("/:organizationId/members", requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const { organizationId } = req.params;
        const members = await getMembers(organizationId);
        return res.status(200).json({
            members,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Failed to fetch members",
        });
    }
});
export default router;
