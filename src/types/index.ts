import type { Task, Project, User, TaskStatus, TaskPriority } from '@/core/db/schema';

export type { Task, Project, User, TaskStatus, TaskPriority };

// API Response Types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Extended Types with Relations
export type TaskWithRelations = Task & {
  assignee?: User | null;
  project: Project;
};

// Form Input Types
export type CreateTaskInput = {
  id?: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
};

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  id: string;
};

// Chat Types
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type ChatConversation = {
  projectId: string;
  messages: ChatMessage[];
};

// Agent Types
export type GeneratedTask = {
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedHours?: number;
};

export type TaskGenerationRequest = {
  projectId: string;
  requirement: string;
};

export type TaskGenerationResponse = {
  tasks: GeneratedTask[];
  reasoning: string;
};

// Analytics Types
export type ProjectMetrics = {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionRate: number;
  completionTrend: number;
};

export type BurndownDataPoint = {
  date: string;
  remaining: number;
  completed: number;
};

export type TaskDistribution = {
  status: TaskStatus;
  count: number;
};

export type PriorityBreakdown = {
  priority: TaskPriority;
  count: number;
};

export type MemberPerformance = {
  userId: string;
  userName: string;
  tasksCompleted: number;
  tasksInProgress: number;
};

export type AnalyticsData = {
  metrics: ProjectMetrics;
  burndown: BurndownDataPoint[];
  distribution: TaskDistribution[];
  priorityBreakdown: PriorityBreakdown[];
  memberPerformance: MemberPerformance[];
};

// UI State Types
export type DateRangeFilter = '7d' | '30d' | '90d' | 'all';

export type ThemeMode = 'light' | 'dark' | 'system';
