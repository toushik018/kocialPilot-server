// Utilities for recent-delete module (placeholder for future helpers)
export const parseIds = (ids: unknown): string[] => {
  if (Array.isArray(ids)) return ids.map(String).filter(Boolean);
  return [];
};
