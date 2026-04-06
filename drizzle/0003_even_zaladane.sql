ALTER TABLE "projects" ADD COLUMN "tech_stack" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "architectural_guidelines" text;