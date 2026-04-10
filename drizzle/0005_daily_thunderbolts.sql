CREATE TABLE "github_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"github_user_login" text NOT NULL,
	"access_token" text NOT NULL,
	"repo_owner" text,
	"repo_name" text,
	"repo_full_name" text,
	"default_branch" text,
	"webhook_id" integer,
	"last_indexed_sha" text,
	"last_indexed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "github_connections_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "github_indexed_files" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"filepath" text NOT NULL,
	"sha" text NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"indexed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_connections" ADD CONSTRAINT "github_connections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_connections" ADD CONSTRAINT "github_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_indexed_files" ADD CONSTRAINT "github_indexed_files_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;