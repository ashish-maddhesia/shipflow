import { Router } from "express";
import { requireAuth, } from "../auth/auth.middleware.js";
import { createRegistry, getOrganizationRegistry, } from "./registry-config.service.js";
const router = Router();
/*
 * Create registry
 *
 * POST /organizations/:organizationId/registries
 */
router.post("/organizations/:organizationId/registries", requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const organizationId = req.params.organizationId;
        const { name, type, registryUrl, username, password, } = req.body;
        if (!name ||
            !type ||
            !registryUrl ||
            !username ||
            !password) {
            return res.status(400).json({
                message: "name, type, registryUrl, username and password are required",
            });
        }
        const allowedTypes = [
            "DOCKER_HUB",
            "GHCR",
            "ECR",
        ];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                message: "Invalid registry type",
            });
        }
        const registry = await createRegistry(organizationId, name.trim(), type, registryUrl.trim(), username.trim(), password);
        return res.status(201).json({
            message: "Registry created successfully",
            registry,
        });
    }
    catch (error) {
        console.error("Create registry error:", error);
        return res.status(400).json({
            message: error instanceof Error
                ? error.message
                : "Failed to create registry",
        });
    }
});
/*
 * Get organization registry
 *
 * GET /organizations/:organizationId/registries
 */
router.get("/organizations/:organizationId/registries", requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const organizationId = req.params.organizationId;
        const registry = await getOrganizationRegistry(organizationId);
        if (!registry) {
            return res.status(404).json({
                message: "Registry not found",
            });
        }
        return res.json({
            registry: {
                id: registry.id,
                organizationId: registry.organizationId,
                name: registry.name,
                type: registry.type,
                registryUrl: registry.registryUrl,
                username: registry.username,
                createdAt: registry.createdAt,
            },
        });
    }
    catch (error) {
        console.error("Get registry error:", error);
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Failed to fetch registry",
        });
    }
});
export default router;
