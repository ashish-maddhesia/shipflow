import { eq, and } from "drizzle-orm";
import { db } from "../lib/db.js";
import { serviceEnvironments, services, environments, } from "../db/schema.js";
export async function attachServiceToEnvironment(serviceId, environmentId) {
    // Check service exists
    const [service] = await db
        .select({
        id: services.id,
    })
        .from(services)
        .where(eq(services.id, serviceId));
    if (!service) {
        throw new Error("Service not found");
    }
    // Check environment exists
    const [environment] = await db
        .select({
        id: environments.id,
    })
        .from(environments)
        .where(eq(environments.id, environmentId));
    if (!environment) {
        throw new Error("Environment not found");
    }
    // Check duplicate mapping
    const [existing] = await db
        .select({
        id: serviceEnvironments.id,
    })
        .from(serviceEnvironments)
        .where(and(eq(serviceEnvironments.serviceId, serviceId), eq(serviceEnvironments.environmentId, environmentId)));
    if (existing) {
        throw new Error("Service is already attached to this environment");
    }
    const [mapping] = await db
        .insert(serviceEnvironments)
        .values({
        id: crypto.randomUUID(),
        serviceId,
        environmentId,
    })
        .returning();
    return mapping;
}
export async function getServiceEnvironments(serviceId) {
    return db
        .select({
        id: serviceEnvironments.id,
        serviceId: serviceEnvironments.serviceId,
        environmentId: serviceEnvironments.environmentId,
        name: environments.name,
        slug: environments.slug,
        type: environments.type,
        createdAt: serviceEnvironments.createdAt,
        updatedAt: serviceEnvironments.updatedAt,
    })
        .from(serviceEnvironments)
        .innerJoin(environments, eq(serviceEnvironments.environmentId, environments.id))
        .where(eq(serviceEnvironments.serviceId, serviceId));
}
export async function removeServiceFromEnvironment(serviceId, environmentId) {
    const [deleted] = await db
        .delete(serviceEnvironments)
        .where(and(eq(serviceEnvironments.serviceId, serviceId), eq(serviceEnvironments.environmentId, environmentId)))
        .returning();
    return deleted;
}
