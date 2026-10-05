import { permissions, } from "./permissions.js";
export function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const userPermissions = permissions[req.user.role];
        if (!userPermissions.includes(permission)) {
            return res.status(403).json({
                message: "You do not have permission to perform this action",
            });
        }
        next();
    };
}
