import { db } from "../lib/db.js";
import {
  projectMembers,
  users,
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: string
) {
  const [member] = await db
    .insert(projectMembers)
    .values({
      id: randomUUID(),
      projectId,
      userId,
      role: role as any,
    })
    .returning();

  return member;
}

export async function getProjectMembers(
  projectId: string
) {
  return await db
    .select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      name: users.name,
      email: users.email,
      role: projectMembers.role,
      createdAt: projectMembers.createdAt,
    })
    .from(projectMembers)
    .innerJoin(
      users,
      eq(projectMembers.userId, users.id)
    )
    .where(
      eq(projectMembers.projectId, projectId)
    );
}
