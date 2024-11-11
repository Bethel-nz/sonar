ALTER TABLE "projects" ADD COLUMN "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_link" varchar(255);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_url" varchar(255);