import { useEffect } from 'react';
import type { ToolDefinition } from './definitions';

export interface ModelContextLike { registerTool: (tool: ToolDefinition) => void; unregisterTool?: (name: string) => void; }
export function getModelContext(): ModelContextLike | null {
  const documentContext = (document as Document & { modelContext?: ModelContextLike }).modelContext;
  if (documentContext) return documentContext;
  return (navigator as Navigator & { modelContext?: ModelContextLike }).modelContext ?? null;
}
export function useTool(tool: ToolDefinition | null, deps: unknown[], onStatus?: (status: 'registered' | 'unavailable' | 'error') => void) {
  useEffect(() => {
    if (!tool) return;
    const context = getModelContext();
    if (!context) { onStatus?.('unavailable'); return; }
    try { context.registerTool(tool); onStatus?.('registered'); return () => context.unregisterTool?.(tool.name); } catch { onStatus?.('error'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, ...deps]);
}
