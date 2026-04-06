-- ============================================================
-- FIX: Apply missing columns + sync Drizzle migration journal
-- Run this in Supabase SQL Editor
-- ============================================================

-- From migration 0002: Add new columns to tasks table
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "ai_metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "ai_generated" boolean DEFAULT false NOT NULL;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "story_points" integer;

-- From migration 0003: Add new columns to projects table
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "tech_stack" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "architectural_guidelines" text;

-- Sync Drizzle migration journal so future 'drizzle-kit migrate' works
CREATE SCHEMA IF NOT EXISTS "drizzle";

CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

DELETE FROM "drizzle"."__drizzle_migrations";

INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES
  ('0000_wandering_blob', 1773771011773),
  ('0001_chat_ai_metrics', 1773787000000),
  ('0002_acoustic_ezekiel_stane', 1774871258810),
  ('0003_even_zaladane', 1775508204521);
