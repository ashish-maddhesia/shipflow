import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

import { db } from "../lib/db.js";
import { services } from "../db/schema.js";

export async function createService(
  projectId: string,
  name: string,
  slug: string,
  description?: string,
  repositoryUrl?: string
) {
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

export async function getProjectServices(
  projectId: string
) {
  return await db
    .select()
    .from(services)
    .where(eq(services.projectId, projectId));
}

export async function getServiceById(
  serviceId: string
) {
  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId));

  return service;
}

export async function updateService(
  serviceId: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    repositoryUrl?: string;
  }
) {
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

export async function deleteService(
  serviceId: string
) {
  const [service] = await db
    .delete(services)
    .where(eq(services.id, serviceId))
    .returning();

  return service;
}