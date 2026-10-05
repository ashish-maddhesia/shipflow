import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../lib/db.js";
import { projects, projectMembers, } from "../db/schema.js";
export async function createProject(name, organizationId, userId) {
    return await db.transaction(async (tx) => {
        const projectId = crypto.randomUUID();
        const [project] = await tx
            .insert(projects)
            .values({
            id: projectId,
            name,
            organizationId,
            createdBy: userId,
        })
            .returning();
        await tx
            .insert(projectMembers)
            .values({
            id: crypto.randomUUID(),
            projectId,
            userId,
            role: "ADMIN",
        });
        return project;
    });
}
export async function getProjects(organizationId) {
    return await db
        .select()
        .from(projects)
        .where(eq(projects.organizationId, organizationId));
}
