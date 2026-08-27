import { useApp } from '../state/AppContext';
import { getToolsForTier } from '../tools/definitions';

export function DuckSidebar() {
  const { state, dispatch } = useApp();
  const tools = getToolsForTier(state.unlockedTier);
  return <aside className="sidebar">
    <div className="duck-mark">◒</div><div className="eyebrow">RUBBER DUCK / LIVE SURFACE</div><h2>Think it through.</h2><p className="muted">The Duck can only use the tools you have earned.</p>
    <div className="token-card"><div><strong>{state.hintTokens} hint tokens</strong><small>Spend one to unlock the next rung.</small></div><button onClick={() => dispatch({ type: 'spendHint' })} disabled={state.hintTokens === 0}>Spend hint</button></div>
    <button className="reset-session" onClick={() => dispatch({ type: 'resetSession' })}>Reset session</button>
    <div className="tool-panel"><div className="panel-label">AGENT TOOL SURFACE <span>{tools.length}/10 live</span></div>
      {[0,1,2,3].map((tier) => <div className="tier" key={tier}><div className="tier-label">L{tier + 1} {['Question','Analogy','Nudge','Next step'][tier]} {tier > state.unlockedTier && <span>🔒</span>}</div>{tools.filter((tool) => tool.tier === tier).map((tool) => <div className="tool-row" key={tool.name}><span className="dot" /><div><strong>{tool.name}</strong><small>{tool.summary}</small></div></div>)}</div>)}
    </div><div className="feed"><div className="panel-label">DUCK NOTES</div>{state.annotations.length === 0 ? <p className="muted">Questions and flags will land beside the step they belong to.</p> : state.annotations.map((annotation) => <div className="feed-item" key={annotation.id}>{annotation.kind === 'question' ? '“' : '⚑'} {annotation.text || 'Review this step again.'}</div>)}</div>
  </aside>;
}
