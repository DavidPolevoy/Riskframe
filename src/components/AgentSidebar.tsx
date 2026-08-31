import { useApp } from '../state/AppContext';
import { TOOL_DEFINITIONS } from '../tools/definitions';

export function AgentSidebar() {
  const { state, dispatch } = useApp();

  return (
    <aside className="sidebar">
      <div className="eyebrow">AGENT CONTROL SURFACE</div>
      <h2>Frame the risk before the decision.</h2>
      <p className="muted">ChatGPT initializes one decision graph through WebMCP with a proposed change path and a status quo path. Riskframe keeps risks, mitigations, tripwires, and unknowns visible on both sides.</p>

      <div className="side-list">
        <div className="panel-label">PARKING LOT <span>{state.parkingLot.length}</span></div>
        {state.parkingLot.length === 0 ? (
          <p className="muted">Parked reasoning will stay retrievable here when it is not ready for the canvas.</p>
        ) : state.parkingLot.map((card) => (
          <article className="parked-card" key={card.id}>
            <div className="card-meta"><span>{card.role}</span><span>{card.epistemicStatus}</span></div>
            <strong>{card.title}</strong>
            <p>{card.body}</p>
            <button onClick={() => dispatch({ type: 'promoteParked', cardId: card.id })}>Promote</button>
          </article>
        ))}
      </div>

      <div className="tool-panel">
        <div className="panel-label">AGENT TOOL SURFACE <span>{TOOL_DEFINITIONS.length} live</span></div>
        {TOOL_DEFINITIONS.map((tool) => (
          <div className="tool-row" key={tool.name}>
            <span className="dot" />
            <div><strong>{tool.name}</strong><small>{tool.summary}</small></div>
          </div>
        ))}
      </div>

      <div className="feed">
        <div className="panel-label">VISIBLE ANALYSIS</div>
        {state.summary && <p>{state.summary}</p>}
        {state.conflicts.map((conflict) => <div className="feed-item" key={conflict.id}>Conflict: {conflict.reason}</div>)}
        {state.fragilePaths.map((path) => <div className="feed-item" key={path.id}>Fragile path: {path.reason}</div>)}
        {!state.summary && state.conflicts.length === 0 && state.fragilePaths.length === 0 && (
          <p className="muted">Conflicts and fragile paths will show here after the graph is inspected.</p>
        )}
      </div>
    </aside>
  );
}
