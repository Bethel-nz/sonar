ALTER TABLE "projects" RENAME COLUMN "project_link" TO "project_url";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "description" DROP NOT NULL;