import { eq } from "drizzle-orm";
import { db } from "../lib/db.js";
import { organizations, organizationMembers, } from "../db/schema.js";
export async function createOrganization(name, userId) {
    const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const organizationId = crypto.randomUUID();
    const [organization] = await db
        .insert(organizations)
        .values({
        id: organizationId,
        name,
        slug,
        createdBy: userId,
    })
        .returning();
    await db.insert(organizationMembers).values({
        id: crypto.randomUUID(),
        organizationId,
        userId,
    });
    return organization;
}
export async function getOrganizations(userId) {
    return await db
        .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        createdBy: organizations.createdBy,
        createdAt: organizations.createdAt,
    })
        .from(organizationMembers)
        .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
        .where(eq(organizationMembers.userId, userId));
}
export async function getOrganizationById(organizationId, userId) {
    const result = await db
        .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        createdBy: organizations.createdBy,
        createdAt: organizations.createdAt,
    })
        .from(organizationMembers)
        .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
        .where(eq(organizationMembers.organizationId, organizationId));
    const organization = result[0];
    if (!organization) {
        return null;
    }
    return organization;
}
