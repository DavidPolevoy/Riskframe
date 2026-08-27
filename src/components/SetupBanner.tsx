import { useEffect, useState } from 'react';
import { getModelContext } from '../tools/useTool';
export function SetupBanner() { const [available, setAvailable] = useState(true); useEffect(() => setAvailable(Boolean(getModelContext())), []); return available ? null : <div className="setup-banner">WebMCP is not detected. Open this page in ChatGPT’s in-app browser, or enable <code>chrome://flags/#enable-webmcp-testing</code> in Chrome 149+.</div>; }
