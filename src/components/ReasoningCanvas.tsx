import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch } from 'react';
import type { Action, LinkType, ReasoningCard } from '../data/types';
import type { OptionPath } from '../domain/decisionGraph';
import { useApp } from '../state/AppContext';
import { getGraphCoverage } from '../state/reducer';

const board = {
  width: 3200,
  height: 2200,
};

const optionPathLabels = {
  change_path: 'Change path',
  status_quo: 'Status quo',
  test_path: 'Test path',
} as const;

const pathDecks: Array<{ path: OptionPath; title: string; subtitle: string }> = [
  { path: 'change_path', title: 'Change path', subtitle: 'What happens if we move forward with the new route?' },
  { path: 'status_quo', title: 'Status quo', subtitle: 'What happens if we keep the regular path?' },
];

const zoomStep = 0.1;
const minZoom = 0.5;
const maxZoom = 1.8;

function clampZoom(value: number) {
  return Math.min(maxZoom, Math.max(minZoom, Number(value.toFixed(2))));
}

export function ReasoningCanvas() {
  const { state, dispatch } = useApp();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const visibleCards = [...state.cards, ...state.proposals];
  const visibleCardById = useMemo(
    () => new Map(visibleCards.map((card) => [card.id, card])),
    [visibleCards],
  );
  const visibleLinks = [...state.links, ...state.proposedLinks].filter(
    (link) => visibleCardById.has(link.sourceId) && visibleCardById.has(link.targetId),
  );
  const coverage = useMemo(() => getGraphCoverage(state), [state]);
  const missingCount = coverage.options.reduce((total, item) => total + item.missing.length, 0);
  const zoomPercent = Math.round(zoom * 100);
  const isDragging = dragRef.current !== null;
  const optionCardsByPath = useMemo(
    () => ({
      change_path: visibleCards.filter((card) => card.role === 'option' && card.optionPath === 'change_path'),
      status_quo: visibleCards.filter((card) => card.role === 'option' && card.optionPath === 'status_quo'),
      test_path: visibleCards.filter((card) => card.role === 'option' && card.optionPath === 'test_path'),
    }),
    [visibleCards],
  );

  function linkedCards(sourceId: string, linkTypes: LinkType[], roles?: ReasoningCard['role'][]) {
    const seenCardIds = new Set<string>();
    return visibleLinks
      .filter((link) => link.sourceId === sourceId && linkTypes.includes(link.type))
      .map((link) => visibleCardById.get(link.targetId))
      .filter((card): card is ReasoningCard => {
        if (!card) return false;
        if (seenCardIds.has(card.id)) return false;
        if (roles && !roles.includes(card.role)) return false;
        seenCardIds.add(card.id);
        return true;
      });
  }

  function startPan(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function movePan(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPan({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });
  }

  function endPan(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const wheelZoom = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setZoom((value) => clampZoom(value + (event.deltaY < 0 ? zoomStep : -zoomStep)));
    };
    viewport.addEventListener('wheel', wheelZoom, { passive: false });
    return () => viewport.removeEventListener('wheel', wheelZoom);
  }, []);

  return (
    <section className="canvas">
      <div className="map-head">
        <div>
          <div className="eyebrow">REASONING CANVAS</div>
          <h2>{state.decision?.normalizedQuestion ?? 'Waiting for ChatGPT to initialize a decision graph'}</h2>
          {state.decision && (
            <p className="decision-frame">
              Objective: {state.decision.objective}
              {state.decision.timeHorizon ? ` · Horizon: ${state.decision.timeHorizon}` : ''}
            </p>
          )}
        </div>
        <div className="map-controls" aria-label="Canvas zoom controls">
          <button onClick={() => setZoom((value) => clampZoom(value - zoomStep))}>Zoom out</button>
          <span>{zoomPercent}%</span>
          <button onClick={() => setZoom((value) => clampZoom(value + zoomStep))}>Zoom in</button>
          <button onClick={() => setZoom(1)}>Reset zoom</button>
        </div>
        <div className="score-pill">{missingCount} coverage gaps · {coverage.unknownCount} unknowns</div>
      </div>

      <div
        className={`reasoning-viewport ${visibleCards.length === 0 ? 'empty' : ''} ${isDragging ? 'is-dragging' : ''}`}
        data-board-height={board.height}
        data-board-width={board.width}
        data-layout-target="compact-split"
        data-testid="reasoning-viewport"
        onPointerCancel={endPan}
        onPointerDown={startPan}
        onPointerLeave={endPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        ref={viewportRef}
      >
        <div
          className="reasoning-world"
          data-testid="reasoning-world"
          style={{ height: board.height, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: board.width }}
        >
          {visibleCards.length === 0 && (
            <div className="empty-canvas">
              <span>Waiting for ChatGPT to initialize a decision graph</span>
            </div>
          )}

          <svg className="reasoning-links" aria-hidden="true" height={board.height} width={board.width}>
            {visibleLinks.map((link) => {
              const source = visibleCardById.get(link.sourceId);
              const target = visibleCardById.get(link.targetId);
              if (!source || !target) return null;
              const midX = source.x + (target.x - source.x) / 2;
              return (
                <path
                  className={`reason-link ${link.type} ${link.reviewStatus}`}
                  d={`M ${source.x + 150} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x - 150} ${target.y}`}
                  key={link.id}
                />
              );
            })}
          </svg>

          {visibleCards.length > 0 && (
            <div className="decision-cockpit" data-testid="decision-cockpit">
              <div className="compact-mode-pill">Compact split-screen mode</div>
              {state.decision && (
                <section className="decision-brief">
                  <div>
                    <div className="eyebrow">DECISION BRIEF</div>
                    <h3>{state.decision.normalizedQuestion}</h3>
                    <p>{state.decision.objective}</p>
                  </div>
                  <div className="brief-stat">
                    <span>{missingCount}</span>
                    <small>coverage gaps</small>
                  </div>
                  <div className="brief-stat">
                    <span>{coverage.unknownCount}</span>
                    <small>unknowns</small>
                  </div>
                </section>
              )}

              <section className="path-comparison" aria-label="Path comparison">
                {pathDecks.map((deck) => (
                  <div className={`path-column ${deck.path}`} data-testid={`path-column-${deck.path}`} key={deck.path}>
                    <div className="path-column-head">
                      <div>
                        <div className="eyebrow">{deck.path.replace('_', ' ')}</div>
                        <h3>{deck.title}</h3>
                      </div>
                      <p>{deck.subtitle}</p>
                    </div>

                    {optionCardsByPath[deck.path].length === 0 && (
                      <p className="muted">No option initialized for this path.</p>
                    )}

                    {optionCardsByPath[deck.path].map((option) => {
                      const outcomes = linkedCards(option.id, ['leads_to'], ['consequence']);
                      const evidence = linkedCards(option.id, ['evaluated_by', 'supports', 'constrained_by'], [
                        'criterion',
                        'constraint',
                        'claim',
                      ]);
                      const risks = linkedCards(option.id, ['risks'], ['risk']);

                      return (
                        <article className="path-trace" data-testid={`path-trace-${option.id}`} key={option.id}>
                          <div className="trace-step option-step">
                            <div className="trace-step-label">Option</div>
                            <CockpitCard card={option} dispatch={dispatch} />
                          </div>

                          <TraceSection cards={outcomes} dispatch={dispatch} relation="leads to" title="Expected outcome" />
                          <div className="trace-step">
                            <div className="trace-step-label">Risk management</div>
                            {risks.length === 0 ? (
                              <p className="muted trace-empty">No risk connected to this option yet.</p>
                            ) : (
                              risks.map((risk) => (
                                <div className="risk-cluster" data-testid={`risk-cluster-${risk.id}`} key={risk.id}>
                                  <div className="risk-cluster-head">
                                    <span className="relationship-chip">risks</span>
                                  </div>
                                  <CockpitCard card={risk} dispatch={dispatch} />
                                  <TraceSection
                                    cards={linkedCards(risk.id, ['mitigated_by'], ['mitigation'])}
                                    compact
                                    dispatch={dispatch}
                                    relation="mitigated by"
                                    title="Mitigation"
                                  />
                                  <TraceSection
                                    cards={linkedCards(risk.id, ['monitored_by'], ['tripwire'])}
                                    compact
                                    dispatch={dispatch}
                                    relation="monitored by"
                                    title="Tripwire"
                                  />
                                  <TraceSection
                                    cards={linkedCards(risk.id, ['depends_on'], ['unknown'])}
                                    compact
                                    dispatch={dispatch}
                                    relation="depends on"
                                    title="Unknown"
                                  />
                                </div>
                              ))
                            )}
                          </div>

                          <TraceSection cards={evidence} dispatch={dispatch} relation="evaluated by" title="Evidence and criteria" />
                        </article>
                      );
                    })}
                  </div>
                ))}
              </section>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TraceSection({
  cards,
  compact = false,
  dispatch,
  relation,
  title,
}: {
  cards: ReasoningCard[];
  compact?: boolean;
  dispatch: Dispatch<Action>;
  relation: string;
  title: string;
}) {
  if (cards.length === 0) return null;

  return (
    <div className={`trace-step trace-section ${compact ? 'compact' : ''}`}>
      <div className="trace-section-head">
        <div className="trace-step-label">{title}</div>
        <span className="relationship-chip">{relation}</span>
      </div>
      <div className="card-stack">
        {cards.map((card) => (
          <CockpitCard card={card} dispatch={dispatch} key={card.id} />
        ))}
      </div>
    </div>
  );
}

function CockpitCard({ card, dispatch }: { card: ReasoningCard; dispatch: Dispatch<Action> }) {
  return (
    <article className={`reason-card ${card.role} ${card.reviewStatus}`} data-testid="cockpit-card">
      <div className="card-meta"><span>{card.role}</span><span>{card.reviewStatus}</span></div>
      {card.optionPath && <div className={`path-badge ${card.optionPath}`}>{optionPathLabels[card.optionPath]}</div>}
      <h3>{card.title}</h3>
      <p>{card.body}</p>
      <div className="epistemic-row">
        <span>{card.epistemicStatus}</span>
        {card.basis && <small>{card.basis}</small>}
      </div>
      {card.reviewStatus === 'draft' && (
        <div className="proposal-actions">
          <button onClick={() => dispatch({ type: 'acceptProposal', proposalId: card.id })}>Accept</button>
          <button onClick={() => dispatch({ type: 'parkProposal', proposalId: card.id })}>Park</button>
          <button onClick={() => dispatch({ type: 'rejectProposal', proposalId: card.id })}>Reject</button>
        </div>
      )}
    </article>
  );
}
