import { eq } from "drizzle-orm";
import { db } from "../lib/db.js";
import { services } from "../db/schema.js";
export async function createService(projectId, name, slug, description, repositoryUrl, branch = "main") {
    const [service] = await db
        .insert(services)
        .values({
        id: crypto.randomUUID(),
        projectId,
        name,
        slug,
        description: description ?? null,
        repositoryUrl: repositoryUrl ?? null,
        branch,
    })
        .returning();
    return service;
}
export async function getProjectServices(projectId) {
    return db.select().from(services)
        .where(eq(services.projectId, projectId));
}
export async function getServiceById(serviceId) {
    const [service] = await db.select().from(services)
        .where(eq(services.id, serviceId)).limit(1);
    return service ?? null;
}
export async function updateService(serviceId, data) {
    const [service] = await db.update(services)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(services.id, serviceId))
        .returning();
    return service ?? null;
}
export async function deleteService(serviceId) {
    const [service] = await db.delete(services)
        .where(eq(services.id, serviceId))
        .returning();
    return service ?? null;
}
