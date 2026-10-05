CREATE TYPE "public"."registry_type" AS ENUM('DOCKER_HUB', 'GHCR', 'ECR');--> statement-breakpoint
CREATE TABLE "registries" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "registry_type" NOT NULL,
	"registry_url" text DEFAULT 'docker.io' NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registries" ADD CONSTRAINT "registries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" DROP COLUMN "image";--> statement-breakpoint
ALTER TABLE "deployments" DROP COLUMN "container_id";--> statement-breakpoint
ALTER TABLE "deployments" DROP COLUMN "container_name";--> statement-breakpoint
ALTER TABLE "deployments" DROP COLUMN "container_port";--> statement-breakpoint
ALTER TABLE "deployments" DROP COLUMN "health_status";--> statement-breakpoint
ALTER TABLE "deployments" DROP COLUMN "error_message";