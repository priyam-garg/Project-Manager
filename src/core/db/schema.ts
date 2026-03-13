import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
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

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Projects table
export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('backlog'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  assigneeId: text('assignee_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Task Events table
export const taskEvents = pgTable('task_events', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id),
  eventType: eventTypeEnum('event_type').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  userId: text('user_id').references(() => users.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
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

// Type exports
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskEvent = typeof taskEvents.$inferSelect;
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];
export type EventType = (typeof eventTypeEnum.enumValues)[number];

