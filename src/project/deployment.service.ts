import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

import { db } from "../lib/db.js";

import {
  deployments,
  serviceEnvironments,
  environments,
} from "../db/schema.js";

import {
  deploymentQueue,
} from "../queue/deployment.queue.js";


export async function createDeployment(
  serviceEnvironmentId: string
) {
  const [deployment] = await db
    .insert(deployments)
    .values({
      id: randomUUID(),
      serviceEnvironmentId,
      status: "PENDING",
    })
    .returning();

  /*
   * Add deployment to BullMQ
   */
  await deploymentQueue.add(
    "deploy",
    {
      deploymentId: deployment.id,
    }
  );

  return deployment;
}


export async function getServiceDeployments(
  serviceId: string
) {
  return await db
    .select({
      id: deployments.id,

      serviceId:
        serviceEnvironments.serviceId,

      environmentId:
        serviceEnvironments.environmentId,

      environmentName:
        environments.name,

      environmentType:
        environments.type,

      status: deployments.status,

      createdAt:
        deployments.createdAt,

      updatedAt:
        deployments.updatedAt,
    })
    .from(deployments)

    .innerJoin(
      serviceEnvironments,
      eq(
        deployments.serviceEnvironmentId,
        serviceEnvironments.id
      )
    )

    .innerJoin(
      environments,
      eq(
        serviceEnvironments.environmentId,
        environments.id
      )
    )

    .where(
      eq(
        serviceEnvironments.serviceId,
        serviceId
      )
    );
}


export async function getDeploymentById(
  deploymentId: string
) {
  const [deployment] = await db
    .select({
      id: deployments.id,

      serviceId:
        serviceEnvironments.serviceId,

      environmentId:
        serviceEnvironments.environmentId,

      environmentName:
        environments.name,

      environmentType:
        environments.type,

      status: deployments.status,

      createdAt:
        deployments.createdAt,

      updatedAt:
        deployments.updatedAt,
    })
    .from(deployments)

    .innerJoin(
      serviceEnvironments,
      eq(
        deployments.serviceEnvironmentId,
        serviceEnvironments.id
      )
    )

    .innerJoin(
      environments,
      eq(
        serviceEnvironments.environmentId,
        environments.id
      )
    )

    .where(
      eq(
        deployments.id,
        deploymentId
      )
    );

  return deployment;
}


export async function updateDeploymentStatus(
  deploymentId: string,
  status:
    | "PENDING"
    | "QUEUED"
    | "BUILDING"
    | "DEPLOYING"
    | "SUCCESS"
    | "FAILED"
) {
  const [deployment] = await db
    .update(deployments)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(
      eq(
        deployments.id,
        deploymentId
      )
    )
    .returning();

  return deployment;
}
