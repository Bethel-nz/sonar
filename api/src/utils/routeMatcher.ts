// utils/routeParams.ts
export const routeParamExtractors = {
  projectId: (path: string) => {
    const match = path.match(/\/projects\/([^\/]+)/);
    return match ? match[1] : null;
  },
  
  workflowName: (path: string) => {
    const match = path.match(/\/workflows\/([^\/]+)/);
    return match ? match[1] : null;
  },

  // Easy to add more extractors:
  eventId: (path: string) => {
    const match = path.match(/\/events\/([^\/]+)/);
    return match ? match[1] : null;
  }
} as const;

// Usage in middleware:


// Or if you need multiple params:
export const getRouteParams = (path: string) => ({
  projectId: routeParamExtractors.projectId(path),
  workflowName: routeParamExtractors.workflowName(path)
});
