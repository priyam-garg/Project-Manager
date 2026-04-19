import type { Task } from '@/core/db/schema';

type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: Task['status'];
  priority: Task['priority'];
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  ai_metadata: Record<string, unknown> | null;
  ai_generated: boolean;
  story_points: number | null;
};

export function mapTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigneeId: row.assignee_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    tags: row.tags ?? [],
    aiMetadata: row.ai_metadata ?? {},
    aiGenerated: row.ai_generated,
    storyPoints: row.story_points,
  };
}
