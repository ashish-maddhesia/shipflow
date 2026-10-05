CREATE TYPE "public"."deployment_status" AS ENUM('PENDING', 'QUEUED', 'BUILDING', 'DEPLOYING', 'SUCCESS', 'FAILED');--> statement-breakpoint
ALTER TABLE "deployments" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."deployment_status";--> statement-breakpoint
ALTER TABLE "deployments" ALTER COLUMN "status" SET DATA TYPE "public"."deployment_status" USING "status"::"public"."deployment_status";--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "branch" text DEFAULT 'main' NOT NULL;