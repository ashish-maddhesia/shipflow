import { eq, and } from "drizzle-orm";
import { db } from "../lib/db.js";
import { services, projectMembers, } from "../db/schema.js";
export function requireServiceProjectRole(...allowedRoles) {
    return async (req, res, next) => {
        try {
            // 1. Make sure the user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    message: "Authentication required",
                });
            }
            // 2. Get service ID from URL
            const serviceId = req.params.serviceId;
            if (!serviceId) {
                return res.status(400).json({
                    message: "Service ID is required",
                });
            }
            // 3. Find the service and its project
            const [service] = await db
                .select({
                projectId: services.projectId,
            })
                .from(services)
                .where(eq(services.id, serviceId));
            if (!service) {
                return res.status(404).json({
                    message: "Service not found",
                });
            }
            // 4. Find user's membership in that project
            const [projectMember] = await db
                .select({
                role: projectMembers.role,
            })
                .from(projectMembers)
                .where(and(eq(projectMembers.projectId, service.projectId), eq(projectMembers.userId, req.user.id)));
            // 5. User isn't a project member
            if (!projectMember) {
                return res.status(403).json({
                    message: "You are not a member of this project",
                });
            }
            // 6. Check project role
            if (!allowedRoles.includes(projectMember.role)) {
                return res.status(403).json({
                    message: "You do not have permission to perform this action",
                });
            }
            // 7. Everything is okay
            next();
        }
        catch (error) {
            console.error("Service authorization error:", error);
            return res.status(500).json({
                message: "Failed to verify service permissions",
            });
        }
    };
}
