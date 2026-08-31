import { describe, expect, it } from 'vitest';
import { validateDecisionGraph } from '../domain/decisionGraph';
import { edge, node, validSnapshot } from './decisionGraphFixtures';

describe('decision graph validation', () => {
  it('accepts a valid atomic decision graph snapshot', () => {
    expect(validateDecisionGraph(validSnapshot)).toEqual({ ok: true, value: validSnapshot });
  });

  it('requires two to four distinct connected options', () => {
    const oneOption = { ...validSnapshot, nodes: validSnapshot.nodes.slice(0, 1), edges: validSnapshot.edges.slice(0, 1) };
    expect(validateDecisionGraph(oneOption)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ code: 'insufficient_options' })]),
    });

    const unconnected = {
      ...validSnapshot,
      edges: validSnapshot.edges.filter((item) => item.targetId !== 'option-validate'),
    };
    expect(validateDecisionGraph(unconnected)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ code: 'unconnected_option' })]),
    });
  });

  it('requires both the proposed change path and the status quo path', () => {
    const missingStatusQuo = {
      ...validSnapshot,
      nodes: validSnapshot.nodes.map((item) => item.role === 'option' ? { ...item, optionPath: 'change_path' as const } : item),
    };

    expect(validateDecisionGraph(missingStatusQuo)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ code: 'missing_status_quo' })]),
    });

    const missingChangePath = {
      ...validSnapshot,
      nodes: validSnapshot.nodes.map((item) => item.role === 'option' ? { ...item, optionPath: 'status_quo' as const } : item),
    };

    expect(validateDecisionGraph(missingChangePath)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ code: 'missing_change_path' })]),
    });
  });

  it('requires every option to expose managed risk', () => {
    const optionWithoutRisk = {
      ...validSnapshot,
      edges: validSnapshot.edges.filter((item) => item.sourceId !== 'option-ship' || item.type !== 'risks'),
    };

    expect(validateDecisionGraph(optionWithoutRisk)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ code: 'missing_option_risk' })]),
    });

    const unmanagedRisk = {
      ...validSnapshot,
      edges: validSnapshot.edges.filter((item) => item.sourceId !== 'risk-ship-adoption'),
    };

    expect(validateDecisionGraph(unmanagedRisk)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ code: 'unmanaged_risk' })]),
    });
  });

  it('rejects duplicate ids, unknown edge endpoints, and invalid source references', () => {
    expect(validateDecisionGraph({
      ...validSnapshot,
      nodes: [...validSnapshot.nodes, node('option-ship', 'claim', 'Duplicate id')],
    })).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ code: 'duplicate_id' })]),
    });

    expect(validateDecisionGraph({
      ...validSnapshot,
      edges: [...validSnapshot.edges, edge('bad-edge', 'missing', 'option-ship', 'supports')],
    })).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ code: 'unknown_reference' })]),
    });

    expect(validateDecisionGraph({
      ...validSnapshot,
      nodes: [...validSnapshot.nodes, node('claim-1', 'claim', 'External claim', 'sourced', '', ['missing-source'])],
    })).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ code: 'unknown_reference' })]),
    });
  });

  it('enforces epistemic rules instead of accepting unsupported model guesses', () => {
    expect(validateDecisionGraph({
      ...validSnapshot,
      nodes: [...validSnapshot.nodes, node('claim-unsupported', 'claim', 'Unsupported inference', 'inferred', '')],
    })).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ code: 'invalid_epistemic_state' })]),
    });

    expect(validateDecisionGraph({
      ...validSnapshot,
      nodes: [...validSnapshot.nodes, node('unknown-sourced', 'unknown', 'Unknown but sourced', 'sourced', '', ['source-1'])],
      sourceRefs: [{ id: 'source-1', title: 'Source', excerpt: 'Evidence', url: 'https://example.com' }],
    })).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ code: 'invalid_epistemic_state' })]),
    });
  });
});
