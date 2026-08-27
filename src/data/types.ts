export type StepStatus = 'draft' | 'flagged' | 'checked';

export interface RubricMilestone { id: string; label: string; }
export interface Problem { id: string; title: string; difficulty: string; statement: string; milestones: RubricMilestone[]; }
export interface StepBlock { id: string; text: string; status: StepStatus; lastEditedAt: number; editCount: number; }
export interface Annotation { id: string; stepId: string; kind: 'question' | 'flag'; text: string; createdAt: number; }
export interface Telemetry { stepId: string | null; idleSeconds: number; rewriteCount: number; isBacktracking: boolean; }
export interface AppState { problem: Problem; steps: StepBlock[]; focusId: string | null; annotations: Annotation[]; hintTokens: number; unlockedTier: number; telemetry: Record<string, Telemetry>; visitedStepIds: string[]; }

export type Action =
  | { type: 'addStep' }
  | { type: 'updateStep'; stepId: string; text: string }
  | { type: 'deleteStep'; stepId: string }
  | { type: 'moveStep'; stepId: string; direction: 'up' | 'down' }
  | { type: 'setFocus'; stepId: string | null }
  | { type: 'spendHint' }
  | { type: 'askQuestion'; stepId: string; text: string }
  | { type: 'placeFlag'; stepId: string }
  | { type: 'awardCheck'; stepId: string };
