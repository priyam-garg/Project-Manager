-- Enable Supabase Realtime for the `tasks` table so clients can subscribe
-- to INSERT / UPDATE / DELETE events via postgres_changes.
--
-- REPLICA IDENTITY FULL ensures DELETE payloads carry the full old row
-- (default REPLICA IDENTITY only ships primary keys, which breaks
-- project_id filtering in the Realtime publication).
ALTER TABLE "tasks" REPLICA IDENTITY FULL;
--> statement-breakpoint
ALTER PUBLICATION "supabase_realtime" ADD TABLE "tasks";
