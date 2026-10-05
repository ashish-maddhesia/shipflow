import { Router } from "express";
import { requireAuth, } from "../auth/auth.middleware.js";
import { createOrganization, getOrganizations, getOrganizationById, } from "./organization.service.js";
const router = Router();
router.post("/", requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Organization name is required",
            });
        }
        const organization = await createOrganization(name.trim(), req.user.id);
        return res.status(201).json({
            message: "Organization created successfully",
            organization,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error instanceof Error
                ? error.message
                : "Failed to create organization",
        });
    }
});
router.get("/", requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const organizations = await getOrganizations(req.user.id);
        return res.json({
            organizations,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Failed to fetch organizations",
        });
    }
});
router.get("/:id", requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const organizationId = req.params.id;
        const organization = await getOrganizationById(organizationId, req.user.id);
        if (!organization) {
            return res.status(404).json({
                message: "Organization not found",
            });
        }
        return res.json({
            organization,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Failed to fetch organization",
        });
    }
});
export default router;
