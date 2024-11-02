CREATE TABLE IF NOT EXISTS "discord_channels" (
	"project_id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"guild_id" text NOT NULL,
	"api_key" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discord_channels" ADD CONSTRAINT "discord_channels_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
