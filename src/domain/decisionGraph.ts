export const DECISION_ROOT_ID = 'decision-root';

export const semanticRoles = ['option', 'criterion', 'constraint', 'claim', 'consequence', 'risk', 'mitigation', 'tripwire', 'unknown'] as const;
export const epistemicStatuses = ['user_stated', 'sourced', 'inferred', 'forecast', 'unknown'] as const;
export const relationshipTypes = ['option_for', 'evaluated_by', 'constrained_by', 'supports', 'contradicts', 'leads_to', 'risks', 'mitigated_by', 'monitored_by', 'depends_on'] as const;
export const optionPaths = ['change_path', 'status_quo', 'test_path'] as const;

export type SemanticRole = (typeof semanticRoles)[number];
export type EpistemicStatus = (typeof epistemicStatuses)[number];
export type RelationshipType = (typeof relationshipTypes)[number];
export type OptionPath = (typeof optionPaths)[number];

export interface DecisionFrame {
  originalText: string;
  normalizedQuestion: string;
  objective: string;
  timeHorizon?: string;
}

export interface SourceRef {
  id: string;
  title: string;
  excerpt?: string;
  url?: string;
}

export interface DecisionNodeInput {
  id: string;
  role: SemanticRole;
  label: string;
  detail: string;
  epistemicStatus: EpistemicStatus;
  basis: string;
  sourceRefIds: string[];
  optionPath?: OptionPath;
}

export interface DecisionEdgeInput {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  rationale: string;
}

export interface DecisionGraphSnapshot {
  schemaVersion: 1;
  decision: DecisionFrame;
  nodes: DecisionNodeInput[];
  edges: DecisionEdgeInput[];
  sourceRefs: SourceRef[];
}

export interface ValidationError {
  code:
    | 'invalid_shape'
    | 'unsupported_schema_version'
    | 'invalid_decision'
    | 'insufficient_options'
    | 'duplicate_id'
    | 'invalid_node'
    | 'invalid_edge'
    | 'invalid_epistemic_state'
    | 'invalid_option_path'
    | 'unknown_reference'
    | 'unconnected_option'
    | 'unconnected_outcome'
    | 'missing_change_path'
    | 'missing_status_quo'
    | 'missing_option_risk'
    | 'unmanaged_risk';
  path: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

const roleSet = new Set<string>(semanticRoles);
const epistemicSet = new Set<string>(epistemicStatuses);
const relationshipSet = new Set<string>(relationshipTypes);
const optionPathSet = new Set<string>(optionPaths);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function hasNodeShape(value: unknown): value is DecisionNodeInput {
  if (!isObject(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    typeof value.role === 'string' &&
    isNonEmptyString(value.label) &&
    typeof value.detail === 'string' &&
    typeof value.epistemicStatus === 'string' &&
    typeof value.basis === 'string' &&
    stringArray(value.sourceRefIds)
  );
}

function hasEdgeShape(value: unknown): value is DecisionEdgeInput {
  if (!isObject(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.sourceId) &&
    isNonEmptyString(value.targetId) &&
    typeof value.type === 'string' &&
    typeof value.rationale === 'string'
  );
}

function hasSourceShape(value: unknown): value is SourceRef {
  if (!isObject(value)) return false;
  return isNonEmptyString(value.id) && isNonEmptyString(value.title);
}

export function validateDecisionGraph(input: unknown): ValidationResult<DecisionGraphSnapshot> {
  if (!isObject(input)) {
    return { ok: false, errors: [{ code: 'invalid_shape', path: '$', message: 'Snapshot must be an object.' }] };
  }

  const errors: ValidationError[] = [];
  const value = input as Partial<DecisionGraphSnapshot>;

  if (value.schemaVersion !== 1) {
    errors.push({ code: 'unsupported_schema_version', path: 'schemaVersion', message: 'schemaVersion must equal 1.' });
  }

  if (
    !isObject(value.decision) ||
    !isNonEmptyString(value.decision.originalText) ||
    !isNonEmptyString(value.decision.normalizedQuestion) ||
    !isNonEmptyString(value.decision.objective)
  ) {
    errors.push({ code: 'invalid_decision', path: 'decision', message: 'Decision text, normalized question, and objective are required.' });
  }

  if (!Array.isArray(value.nodes) || !Array.isArray(value.edges) || !Array.isArray(value.sourceRefs)) {
    errors.push({ code: 'invalid_shape', path: '$', message: 'nodes, edges, and sourceRefs must be arrays.' });
    return { ok: false, errors };
  }

  const sourceIds = new Set<string>();
  value.sourceRefs.forEach((source, index) => {
    if (!hasSourceShape(source)) {
      errors.push({ code: 'invalid_shape', path: `sourceRefs[${index}]`, message: 'Source references require id and title.' });
      return;
    }
    if (sourceIds.has(source.id)) {
      errors.push({ code: 'duplicate_id', path: `sourceRefs[${index}].id`, message: `Duplicate source id: ${source.id}` });
    }
    sourceIds.add(source.id);
  });

  const nodeIds = new Set<string>();
  const optionIds: string[] = [];
  const optionPathById = new Map<string, OptionPath>();
  const shapedNodes: DecisionNodeInput[] = [];

  value.nodes.forEach((rawNode, index) => {
    if (!hasNodeShape(rawNode)) {
      errors.push({ code: 'invalid_node', path: `nodes[${index}]`, message: 'Node requires id, role, label, detail, epistemicStatus, basis, and sourceRefIds.' });
      return;
    }

    shapedNodes.push(rawNode);
    if (nodeIds.has(rawNode.id)) {
      errors.push({ code: 'duplicate_id', path: `nodes[${index}].id`, message: `Duplicate node id: ${rawNode.id}` });
    }
    nodeIds.add(rawNode.id);

    if (!roleSet.has(rawNode.role) || !epistemicSet.has(rawNode.epistemicStatus)) {
      errors.push({ code: 'invalid_node', path: `nodes[${index}]`, message: 'Unsupported node role or epistemic status.' });
    }
    if (rawNode.role === 'option') {
      optionIds.push(rawNode.id);
      if (typeof rawNode.optionPath !== 'string' || !optionPathSet.has(rawNode.optionPath)) {
        errors.push({ code: 'invalid_option_path', path: `nodes[${index}].optionPath`, message: 'Options require optionPath: change_path, status_quo, or test_path.' });
      } else {
        optionPathById.set(rawNode.id, rawNode.optionPath);
      }
    } else if (typeof rawNode.optionPath === 'string' && !optionPathSet.has(rawNode.optionPath)) {
      errors.push({ code: 'invalid_option_path', path: `nodes[${index}].optionPath`, message: 'Unsupported optionPath.' });
    }
    if ((rawNode.epistemicStatus === 'inferred' || rawNode.epistemicStatus === 'forecast') && !rawNode.basis.trim()) {
      errors.push({ code: 'invalid_epistemic_state', path: `nodes[${index}].basis`, message: 'Inferences and forecasts require a basis.' });
    }
    if (rawNode.epistemicStatus === 'sourced' && rawNode.sourceRefIds.length === 0) {
      errors.push({ code: 'invalid_epistemic_state', path: `nodes[${index}].sourceRefIds`, message: 'Sourced nodes require a source reference.' });
    }
    if (rawNode.role === 'unknown' && rawNode.epistemicStatus === 'sourced') {
      errors.push({ code: 'invalid_epistemic_state', path: `nodes[${index}].epistemicStatus`, message: 'Unknown nodes cannot be sourced.' });
    }
    rawNode.sourceRefIds.forEach((id) => {
      if (!sourceIds.has(id)) {
        errors.push({ code: 'unknown_reference', path: `nodes[${index}].sourceRefIds`, message: `Unknown source reference: ${id}` });
      }
    });
  });

  if (optionIds.length < 2 || optionIds.length > 4) {
    errors.push({ code: 'insufficient_options', path: 'nodes', message: 'The graph must contain two to four options.' });
  }

  const optionPathsPresent = new Set(optionPathById.values());
  if (!optionPathsPresent.has('change_path')) {
    errors.push({ code: 'missing_change_path', path: 'nodes', message: 'The graph must include at least one proposed change path option.' });
  }
  if (!optionPathsPresent.has('status_quo')) {
    errors.push({ code: 'missing_status_quo', path: 'nodes', message: 'The graph must include at least one status quo option.' });
  }

  const endpointIds = new Set([DECISION_ROOT_ID, ...nodeIds]);
  const shapedEdges: DecisionEdgeInput[] = [];
  const edgeIds = new Set<string>();

  value.edges.forEach((rawEdge, index) => {
    if (!hasEdgeShape(rawEdge)) {
      errors.push({ code: 'invalid_edge', path: `edges[${index}]`, message: 'Edge requires id, sourceId, targetId, type, and rationale.' });
      return;
    }

    shapedEdges.push(rawEdge);
    if (edgeIds.has(rawEdge.id)) {
      errors.push({ code: 'duplicate_id', path: `edges[${index}].id`, message: `Duplicate edge id: ${rawEdge.id}` });
    }
    edgeIds.add(rawEdge.id);
    if (!relationshipSet.has(rawEdge.type)) {
      errors.push({ code: 'invalid_edge', path: `edges[${index}].type`, message: 'Unsupported edge relationship type.' });
    }
    if (!endpointIds.has(rawEdge.sourceId) || !endpointIds.has(rawEdge.targetId)) {
      errors.push({ code: 'unknown_reference', path: `edges[${index}]`, message: 'Edge endpoint does not exist.' });
    }
  });

  optionIds.forEach((id) => {
    if (!shapedEdges.some((edge) => edge.sourceId === DECISION_ROOT_ID && edge.targetId === id && edge.type === 'option_for')) {
      errors.push({ code: 'unconnected_option', path: 'edges', message: `Option ${id} is not connected to the decision root.` });
    }
    if (!shapedEdges.some((edge) => edge.sourceId === id && edge.type === 'risks' && shapedNodes.some((node) => node.id === edge.targetId && node.role === 'risk'))) {
      errors.push({ code: 'missing_option_risk', path: 'edges', message: `Option ${id} does not expose a direct risk.` });
    }
  });

  shapedNodes
    .filter((node) => node.role === 'consequence' || node.role === 'risk')
    .forEach((node) => {
      if (!shapedEdges.some((edge) => optionIds.includes(edge.sourceId) && edge.targetId === node.id)) {
        errors.push({ code: 'unconnected_outcome', path: 'edges', message: `${node.role} ${node.id} is not connected to an option.` });
      }
    });

  shapedNodes
    .filter((node) => node.role === 'risk')
    .forEach((risk) => {
      const managed = shapedEdges.some((edge) => {
        if (edge.sourceId !== risk.id) return false;
        const target = shapedNodes.find((node) => node.id === edge.targetId);
        return (
          (edge.type === 'mitigated_by' && target?.role === 'mitigation') ||
          (edge.type === 'monitored_by' && target?.role === 'tripwire') ||
          (edge.type === 'depends_on' && target?.role === 'unknown')
        );
      });
      if (!managed) {
        errors.push({ code: 'unmanaged_risk', path: 'edges', message: `Risk ${risk.id} needs a mitigation, tripwire, or unknown dependency.` });
      }
    });

  return errors.length ? { ok: false, errors } : { ok: true, value: input as unknown as DecisionGraphSnapshot };
}
