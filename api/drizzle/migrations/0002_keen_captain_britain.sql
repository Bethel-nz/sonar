ALTER TABLE "telegram_channels" ADD COLUMN "chat_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "telegram_channels" DROP COLUMN IF EXISTS "telegram_user_id";