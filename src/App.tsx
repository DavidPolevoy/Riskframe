import { useMemo, useState } from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { ProblemCanvas } from './components/ProblemCanvas';
import { DuckSidebar } from './components/DuckSidebar';
import { SetupBanner } from './components/SetupBanner';
import { attachHandlers, createToolHandlers } from './tools/runtime';
import { getToolsForTier } from './tools/definitions';
import { useTool } from './tools/useTool';

function Desk() { const { state, dispatch } = useApp(); const [registered, setRegistered] = useState<string[]>([]); const handlerMap = useMemo(() => createToolHandlers(dispatch, () => state), [dispatch, state]); const definitions = useMemo(() => getToolsForTier(state.unlockedTier).map((definition) => attachHandlers(definition, handlerMap)), [state.unlockedTier, handlerMap]); useTool(definitions, [state.unlockedTier, state.problem.id], () => setRegistered((current) => Array.from(new Set([...current, ...definitions.map((definition) => definition.name)])))); return <><SetupBanner /><div className="desk"><header className="masthead"><div><div className="eyebrow">A STUDY COMPANION WITH A BOUNDARY</div><h1>Rubber Duck</h1><p>Think it through. Earn the next question.</p></div><div className="live-pill"><span /> {registered.length || definitions.length} tools live</div></header><div className="layout"><ProblemCanvas /><DuckSidebar /></div></div></>; }
export default function App() { return <AppProvider><Desk /></AppProvider>; }
