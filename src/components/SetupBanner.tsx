import { useEffect, useState } from 'react';
import { getModelContext } from '../tools/useTool';
export function SetupBanner() { const [available, setAvailable] = useState(true); useEffect(() => setAvailable(Boolean(getModelContext())), []); return available ? null : <div className="setup-banner">ChatGPT site tools are unavailable in this session. In the ChatGPT desktop app, open Browser settings → Permissions and enable site tools, then reload this page. Chrome fallback: <code>chrome://flags/#enable-webmcp-testing</code>.</div>; }
