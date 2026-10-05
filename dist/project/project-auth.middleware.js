import { eq, and } from "drizzle-orm";
import { db } from "../lib/db.js";
import { projectMembers, } from "../db/schema.js";
export function requireProjectRole(...allowedRoles) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: "Authentication required",
                });
            }
            const projectId = req.params.projectId;
            if (!projectId) {
                return res.status(400).json({
                    message: "Project ID is required",
                });
            }
            const [projectMember] = await db
                .select({
                role: projectMembers.role,
            })
                .from(projectMembers)
                .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, req.user.id)));
            if (!projectMember) {
                return res.status(403).json({
                    message: "You are not a member of this project",
                });
            }
            if (!allowedRoles.includes(projectMember.role)) {
                return res.status(403).json({
                    message: "You do not have permission to perform this action",
                });
            }
            next();
        }
        catch (error) {
            console.error("Project authorization error:", error);
            return res.status(500).json({
                message: "Failed to verify project permissions",
            });
        }
    };
}
