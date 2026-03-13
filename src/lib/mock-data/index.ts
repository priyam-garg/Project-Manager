import type { User } from '@/core/db/schema';

// Utility to simulate network delay
export function simulateDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// Generate random ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Mock users pool
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice Johnson',
    avatarUrl: '/avatars/alice.jpg',
    createdAt: new Date(),
  },
  {
    id: 'user-2',
    email: 'bob@example.com',
    name: 'Bob Smith',
    avatarUrl: '/avatars/bob.jpg',
    createdAt: new Date(),
  },
  {
    id: 'user-3',
    email: 'carol@example.com',
    name: 'Carol Williams',
    avatarUrl: '/avatars/carol.jpg',
    createdAt: new Date(),
  },
  {
    id: 'user-4',
    email: 'david@example.com',
    name: 'David Brown',
    avatarUrl: '/avatars/david.jpg',
    createdAt: new Date(),
  },
];

// Task title templates
const taskTitles = [
  'Implement user authentication',
  'Design database schema',
  'Create API endpoints',
  'Build responsive UI',
  'Write unit tests',
  'Set up CI/CD pipeline',
  'Optimize performance',
  'Fix critical bug',
  'Update documentation',
  'Refactor legacy code',
  'Add error handling',
  'Implement caching layer',
  'Create admin dashboard',
  'Set up monitoring',
  'Add analytics tracking',
];

// Task description templates
const taskDescriptions = [
  'This task requires careful planning and execution to ensure all requirements are met.',
  'Need to coordinate with the design team to finalize the specifications.',
  'Blocked by infrastructure setup - waiting for DevOps team.',
  'High priority for the upcoming release - must be completed this sprint.',
  'Technical debt that needs addressing to improve code maintainability.',
  'Performance optimization opportunity identified during code review.',
  'Security vulnerability that needs immediate attention.',
  'User-reported issue affecting multiple customers.',
];

export function generateMockTask(input: Partial<import('@/types').CreateTaskInput>): import('@/core/db/schema').Task {
  const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];

  return {
    id: input.id || generateId(),
    projectId: input.projectId || 'project-1',
    title: input.title || taskTitles[Math.floor(Math.random() * taskTitles.length)],
    description:
      input.description || taskDescriptions[Math.floor(Math.random() * taskDescriptions.length)],
    status: input.status || 'backlog',
    priority: input.priority || 'medium',
    assigneeId: input.assigneeId || randomUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function generateMockTasks(
  projectId: string,
  count: number
): import('@/core/db/schema').Task[] {
  const statuses: import('@/core/db/schema').TaskStatus[] = [
    'backlog',
    'todo',
    'in_progress',
    'done',
  ];
  const priorities: import('@/core/db/schema').TaskPriority[] = ['low', 'medium', 'high'];

  return Array.from({ length: count }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    return generateMockTask({
      projectId,
      status,
      priority,
      title: `${taskTitles[i % taskTitles.length]} #${i + 1}`,
    });
  });
}

export function generateMockProjects(count: number): import('@/core/db/schema').Project[] {
  const projectNames = [
    'E-commerce Platform',
    'Mobile App Redesign',
    'Data Pipeline Migration',
    'Marketing Website',
    'Internal Admin Tool',
    'Customer Portal',
    'Analytics Dashboard',
    'API Gateway',
  ];

  const projectDescriptions = [
    'Building a modern e-commerce platform with advanced features',
    'Complete redesign of our mobile application for better UX',
    'Migrating legacy data pipeline to cloud infrastructure',
    'New marketing website with improved SEO and performance',
    'Internal tool for team management and operations',
    'Customer-facing portal for self-service support',
    'Real-time analytics dashboard for business insights',
    'Centralized API gateway for microservices architecture',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `project-${i + 1}`,
    name: projectNames[i % projectNames.length],
    description: projectDescriptions[i % projectDescriptions.length],
    createdAt: new Date(Date.now() - (count - i) * 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  }));
}

export function generateMockChatResponse(userMessage: string): import('@/types').ChatMessage {
  const responses = [
    'Based on the project data, I found 3 relevant tasks matching your query. The most critical one is "Implement user authentication" which is currently in progress.',
    'The current sprint has 12 tasks in progress and 8 completed. Your team is on track to meet the sprint goals.',
    'Here are the high-priority items that need attention this week: 1) Fix critical bug in payment flow, 2) Complete API documentation, 3) Deploy staging environment.',
    'I analyzed the codebase and found potential optimization opportunities in the database query layer. Would you like me to create tasks for these improvements?',
    'The team velocity has increased by 15% compared to last sprint. Great work! The main contributors are Alice and Bob.',
    'I found 2 blocking issues: "Set up CI/CD pipeline" is waiting for DevOps approval, and "Database migration" needs review from the architecture team.',
    'Your project has 45 total tasks: 8 in backlog, 12 in todo, 15 in progress, and 10 completed. The completion rate is 22%.',
  ];

  return {
    id: generateId(),
    role: 'assistant',
    content: responses[Math.floor(Math.random() * responses.length)],
    timestamp: new Date(),
  };
}

export function generateMockTaskGeneration(
  requirement: string
): import('@/types').TaskGenerationResponse {
  const tasks: import('@/types').GeneratedTask[] = [
    {
      title: 'Set up project structure',
      description:
        'Initialize the project with necessary dependencies and folder structure following best practices',
      priority: 'high',
      estimatedHours: 2,
    },
    {
      title: 'Implement core functionality',
      description: `Build the main features as described in the requirement: "${requirement.substring(0, 50)}..."`,
      priority: 'high',
      estimatedHours: 8,
    },
    {
      title: 'Add error handling and validation',
      description:
        'Implement comprehensive error handling, input validation, and edge case management',
      priority: 'medium',
      estimatedHours: 3,
    },
    {
      title: 'Write unit and integration tests',
      description:
        'Create comprehensive test coverage for the new functionality including edge cases',
      priority: 'medium',
      estimatedHours: 4,
    },
    {
      title: 'Update documentation',
      description:
        'Document the new feature, update API docs, and create user guides as needed',
      priority: 'low',
      estimatedHours: 2,
    },
  ];

  return {
    tasks,
    reasoning: `I analyzed the requirement "${requirement}" and broke it down into ${tasks.length} actionable tasks. The approach follows best practices: setup, implementation, error handling, testing, and documentation. Total estimated effort: ${tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)} hours.`,
  };
}

export function generateMockAnalytics(
  projectId: string,
  dateRange: import('@/types').DateRangeFilter
): import('@/types').AnalyticsData {
  const totalTasks = 50;
  const completedTasks = 32;
  const inProgressTasks = 12;

  // Generate burndown data based on date range
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 180;

  return {
    metrics: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      completionRate: Math.round((completedTasks / totalTasks) * 100),
      completionTrend: 12.5,
    },
    burndown: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      remaining: Math.max(0, totalTasks - i * 2),
      completed: Math.min(totalTasks, i * 2),
    })),
    distribution: [
      { status: 'backlog', count: 6 },
      { status: 'todo', count: 8 },
      { status: 'in_progress', count: 12 },
      { status: 'done', count: 32 },
    ],
    priorityBreakdown: [
      { priority: 'low', count: 15 },
      { priority: 'medium', count: 25 },
      { priority: 'high', count: 10 },
    ],
    memberPerformance: mockUsers.map((user, i) => ({
      userId: user.id,
      userName: user.name,
      tasksCompleted: 8 + i * 2,
      tasksInProgress: 2 + i,
    })),
  };
}
