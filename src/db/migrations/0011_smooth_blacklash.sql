ALTER TABLE "deployments" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "container_id" text;--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "container_name" text;--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "container_port" text;--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "health_status" text;--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "error_message" text;