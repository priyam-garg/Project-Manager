import { pgTable, text, timestamp, pgEnum, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const taskStatusEnum = pgEnum('task_status', [
  'backlog',
  'todo',
  'in_progress',
  'done',
]);

export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);

export const eventTypeEnum = pgEnum('event_type', [
  'created',
  'updated',
  'status_changed',
  'assigned',
  'deleted',
]);

export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member']);

export const chatRoleEnum = pgEnum('chat_role', ['user', 'assistant']);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Project Members ──────────────────────────────────────────────────────────

export const projectMembers = pgTable('project_members', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: memberRoleEnum('role').notNull().default('member'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('backlog'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Task Events ──────────────────────────────────────────────────────────────

export const taskEvents = pgTable('task_events', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  eventType: eventTypeEnum('event_type').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// ─── Chat Messages ────────────────────────────────────────────────────────────

export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  role: chatRoleEnum('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Agent Generations ────────────────────────────────────────────────────────

export const agentGenerations = pgTable('agent_generations', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  requirement: text('requirement').notNull(),
  generatedTasks: jsonb('generated_tasks').notNull(),
  reasoning: text('reasoning').notNull(),
  acceptedCount: integer('accepted_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  memberships: many(projectMembers),
  assignedTasks: many(tasks),
  chatMessages: many(chatMessages),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  members: many(projectMembers),
  tasks: many(tasks),
  chatMessages: many(chatMessages),
  agentGenerations: many(agentGenerations),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  events: many(taskEvents),
}));

export const taskEventsRelations = relations(taskEvents, ({ one }) => ({
  task: one(tasks, {
    fields: [taskEvents.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskEvents.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  project: one(projects, {
    fields: [chatMessages.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const agentGenerationsRelations = relations(agentGenerations, ({ one }) => ({
  project: one(projects, {
    fields: [agentGenerations.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [agentGenerations.userId],
    references: [users.id],
  }),
}));

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskEvent = typeof taskEvents.$inferSelect;
export type ChatMessageRecord = typeof chatMessages.$inferSelect;
export type AgentGeneration = typeof agentGenerations.$inferSelect;
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];
export type EventType = (typeof eventTypeEnum.enumValues)[number];
export type MemberRole = (typeof memberRoleEnum.enumValues)[number];
export type ChatRole = (typeof chatRoleEnum.enumValues)[number];
