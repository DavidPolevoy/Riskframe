import { useEffect } from 'react';
import type { ToolDefinition } from './definitions';

export interface ModelContextLike { registerTool: (tool: ToolDefinition) => void | Promise<void>; unregisterTool?: (name: string) => void | Promise<void>; }
export function getModelContext(): ModelContextLike | null {
  const documentContext = (document as Document & { modelContext?: ModelContextLike }).modelContext;
  if (documentContext) return documentContext;
  return (navigator as Navigator & { modelContext?: ModelContextLike }).modelContext ?? null;
}
const registeredNames = new WeakMap<object, Set<string>>();
export async function registerToolSet(context: ModelContextLike, tools: ToolDefinition[]) {
  const names = registeredNames.get(context) ?? new Set<string>();
  registeredNames.set(context, names);
  for (const tool of tools) {
    if (names.has(tool.name)) continue;
    await context.registerTool(tool);
    names.add(tool.name);
  }
  return () => Promise.all(tools.map(async (tool) => { if (context.unregisterTool) { await context.unregisterTool(tool.name); names.delete(tool.name); } }));
}
export function useTool(tool: ToolDefinition | ToolDefinition[] | null, deps: unknown[], onStatus?: (status: 'registered' | 'unavailable' | 'error') => void) {
  useEffect(() => {
    if (!tool) return;
    const tools = Array.isArray(tool) ? tool : [tool];
    const context = getModelContext();
    if (!context) { onStatus?.('unavailable'); return; }
    let cleanup: (() => Promise<void[]>) | undefined;
    let cancelled = false;
    registerToolSet(context, tools).then((dispose) => { if (cancelled) { void dispose(); return; } cleanup = dispose; tools.forEach(() => onStatus?.('registered')); }).catch(() => onStatus?.('error'));
    return () => { cancelled = true; void cleanup?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, ...deps]);
}
