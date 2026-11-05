export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  executors: ['executors'] as const,
  sites: {
    all: ['sites'] as const,
    list: ['sites', 'list'] as const,
    detail: (siteId: string) => ['sites', 'detail', siteId] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    lists: ['tasks', 'list'] as const,
    bySite: (siteId: string) => ['tasks', 'list', 'site', siteId] as const,
    assigned: (userId: string) => ['tasks', 'list', 'assigned', userId] as const,
    detail: (taskId: string) => ['tasks', 'detail', taskId] as const,
    history: (taskId: string) => ['tasks', 'detail', taskId, 'history'] as const,
    transitions: (taskId: string) => ['tasks', 'detail', taskId, 'transitions'] as const,
  },
}
