import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../lib/db.js";
import { services } from "../db/schema.js";
export async function createService(projectId, name, slug, description, repositoryUrl) {
    const [service] = await db
        .insert(services)
        .values({
        id: randomUUID(),
        projectId,
        name,
        slug,
        description,
        repositoryUrl,
    })
        .returning();
    return service;
}
export async function getProjectServices(projectId) {
    return await db
        .select()
        .from(services)
        .where(eq(services.projectId, projectId));
}
export async function getServiceById(serviceId) {
    const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceId));
    return service;
}
export async function updateService(serviceId, data) {
    const [service] = await db
        .update(services)
        .set({
        ...data,
        updatedAt: new Date(),
    })
        .where(eq(services.id, serviceId))
        .returning();
    return service;
}
export async function deleteService(serviceId) {
    const [service] = await db
        .delete(services)
        .where(eq(services.id, serviceId))
        .returning();
    return service;
}
