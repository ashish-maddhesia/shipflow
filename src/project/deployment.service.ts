import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

import { db } from "../lib/db.js";

import {
  deployments,
  serviceEnvironments,
  environments,
  projects,
  services,
  servers,
} from "../db/schema.js";

import {
  deploymentQueue,
} from "../queue/deployment.queue.js";


export async function createDeployment(
  serviceEnvironmentId: string,
  serverId: string
) {
  // Validate the service environment and target server belong
  // to the same organization before creating a deployment.
  const [target] = await db
    .select({
      serviceEnvironmentId: serviceEnvironments.id,
      organizationId: projects.organizationId,
      serverOrganizationId: servers.organizationId,
      serverId: servers.id,
      serverStatus: servers.status,
      repositoryUrl: services.repositoryUrl,
      branch: services.branch,
      serviceName: services.name,
      serviceSlug: services.slug,
      environmentName: environments.name,
      environmentType: environments.type,
    })
    .from(serviceEnvironments)
    .innerJoin(
      services,
      eq(serviceEnvironments.serviceId, services.id)
    )
    .innerJoin(
      projects,
      eq(services.projectId, projects.id)
    )
    .innerJoin(
      environments,
      eq(serviceEnvironments.environmentId, environments.id)
    )
    .innerJoin(
      servers,
      eq(servers.id, serverId)
    )
    .where(eq(serviceEnvironments.id, serviceEnvironmentId))
    .limit(1);

  if (!target) {
    throw new Error(
      "Service environment or target server was not found"
    );
  }

  if (target.serverStatus !== "READY") {
    throw new Error(
      "Target server is not READY. Test its SSH connection first."
    );
  }

  if (target.repositoryUrl === null || !target.repositoryUrl.trim()) {
    throw new Error("The service does not have a repository URL configured");
  }

  const [serviceProject] = await db
    .select({
      organizationId: projects.organizationId,
    })
    .from(serviceEnvironments)
    .innerJoin(
      services,
      eq(serviceEnvironments.serviceId, services.id)
    )
    .innerJoin(
      projects,
      eq(services.projectId, projects.id)
    )
    .where(eq(serviceEnvironments.id, serviceEnvironmentId))
    .limit(1);

  if (
    !serviceProject ||
    serviceProject.organizationId !== target.serverOrganizationId
  ) {
    throw new Error(
      "The target server must belong to the service's organization"
    );
  }

  const [deployment] = await db
    .insert(deployments)
    .values({
      id: randomUUID(),
      serviceEnvironmentId,
      serverId,
      status: "PENDING",
    })
    .returning();

  await deploymentQueue.add(
    "deploy",
    { deploymentId: deployment.id },
    { attempts: 1 }
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
