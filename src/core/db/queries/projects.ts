import { eq, and } from 'drizzle-orm';
import { db } from '../client';
import { projects, projectMembers } from '../schema';
import type { Project } from '../schema';

/**
 * Generate a unique ID for new records.
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get all projects where the user is a member (or owner).
 */
export async function getUserProjects(userId: string): Promise<Project[]> {
  const memberships = await db
    .select({
      project: projects,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(eq(projectMembers.userId, userId));

  return memberships.map((m) => m.project);
}

/**
 * Get a single project by ID.
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result[0] ?? null;
}

/**
 * Create a new project and add the creator as owner.
 */
export async function createProject(
  data: { name: string; description?: string },
  ownerId: string
): Promise<Project> {
  const projectId = generateId();
  const now = new Date();

  const [project] = await db
    .insert(projects)
    .values({
      id: projectId,
      name: data.name,
      description: data.description ?? null,
      ownerId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Add creator as owner in project_members
  await db.insert(projectMembers).values({
    id: generateId(),
    projectId: project.id,
    userId: ownerId,
    role: 'owner',
  });

  return project;
}

/**
 * Update a project's name and/or description.
 */
export async function updateProject(
  projectId: string,
  data: { name?: string; description?: string }
): Promise<Project | null> {
  const [updated] = await db
    .update(projects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
    .returning();

  return updated ?? null;
}

/**
 * Delete a project (cascades to tasks, members, chat, etc.)
 */
export async function deleteProject(projectId: string): Promise<void> {
  await db.delete(projects).where(eq(projects.id, projectId));
}

/**
 * Check if a user is a member of a project.
 */
export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  const result = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);

  return result.length > 0;
}
