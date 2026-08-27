import { useEffect } from 'react';
import type { ToolDefinition } from './definitions';

export interface ModelContextLike { registerTool: (tool: ToolDefinition) => void; unregisterTool?: (name: string) => void; }
export function getModelContext(): ModelContextLike | null {
  const documentContext = (document as Document & { modelContext?: ModelContextLike }).modelContext;
  if (documentContext) return documentContext;
  return (navigator as Navigator & { modelContext?: ModelContextLike }).modelContext ?? null;
}
export function useTool(tool: ToolDefinition | ToolDefinition[] | null, deps: unknown[], onStatus?: (status: 'registered' | 'unavailable' | 'error') => void) {
  useEffect(() => {
    if (!tool) return;
    const tools = Array.isArray(tool) ? tool : [tool];
    const context = getModelContext();
    if (!context) { onStatus?.('unavailable'); return; }
    try { tools.forEach((item) => context.registerTool(item)); tools.forEach((item) => onStatus?.('registered')); return () => tools.forEach((item) => context.unregisterTool?.(item.name)); } catch { onStatus?.('error'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, ...deps]);
}
