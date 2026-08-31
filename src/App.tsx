import { useMemo, useRef, useState } from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { AgentSidebar } from './components/AgentSidebar';
import { ReasoningCanvas } from './components/ReasoningCanvas';
import { SetupBanner } from './components/SetupBanner';
import { demoDecisionGraph } from './data/demoDecisionGraph';
import { attachHandlers, createToolHandlers } from './tools/runtime';
import { TOOL_DEFINITIONS } from './tools/definitions';
import { useTool } from './tools/useTool';

function Desk() {
  const { state, dispatch } = useApp();
  const [registered, setRegistered] = useState<string[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;
  const handlerMap = useMemo(() => createToolHandlers(dispatch, () => stateRef.current), [dispatch]);
  const definitions = useMemo(() => TOOL_DEFINITIONS.map((definition) => attachHandlers(definition, handlerMap)), [handlerMap]);

  useTool(definitions, [state.cards.length, state.proposals.length, state.parkingLot.length, state.sourceRefs.length], () => {
    setRegistered(definitions.map((definition) => definition.name));
  });

  return (
    <>
      <SetupBanner />
      <div className="desk">
        <header className="masthead">
          <div>
            <div className="eyebrow">VISUAL REASONING DEBUGGER</div>
            <h1>Riskframe</h1>
            <p>Tell ChatGPT a messy decision. It frames both paths, their risks, and the controls before you commit.</p>
          </div>
          <div className="header-actions">
            <div className="live-pill"><span /> {registered.length || definitions.length} tools live</div>
            <button className="reset-session" onClick={() => dispatch({ type: 'initializeDecisionGraph', snapshot: demoDecisionGraph })}>Populate board</button>
            <button className="reset-session" onClick={() => dispatch({ type: 'resetSession' })}>Reset session</button>
          </div>
        </header>
        <div className="layout">
          <ReasoningCanvas />
          <AgentSidebar />
        </div>
      </div>
    </>
  );
}

export default function App() {
  return <AppProvider><Desk /></AppProvider>;
}
