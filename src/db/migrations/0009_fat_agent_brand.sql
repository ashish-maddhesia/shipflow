ALTER TABLE "deployments" DROP CONSTRAINT "deployments_service_id_services_id_fk";
--> statement-breakpoint
ALTER TABLE "deployments" DROP CONSTRAINT "deployments_environment_id_environments_id_fk";
--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "service_environment_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_service_environment_id_service_environments_id_fk" FOREIGN KEY ("service_environment_id") REFERENCES "public"."service_environments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" DROP COLUMN "service_id";--> statement-breakpoint
ALTER TABLE "deployments" DROP COLUMN "environment_id";