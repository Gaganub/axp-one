"use client";
import Link from 'next/link';
import {useCallback, useEffect, useRef, useState, type FormEvent} from 'react';
import {Ld} from '@axp/design-system/ledger';
import {productRequest} from './api.mjs';
import {createRenderAcknowledger, createSponsoredCard, inspectPlacement} from '../../../../../packages/publisher-sdk/browser.mjs';
import type {Award, OpportunityInput, OpportunityResult, ReceiptResult, RenderObservation} from '../../../../../packages/publisher-sdk/index.mjs';
import {PeekInside} from './PeekInside';
import {money, moneyUnit, financialModeOf, type Config, type Answer, type Turn, type WorkspaceState} from './model';
import './publisher-demo.css';

const err = (error: unknown) => error instanceof Error ? error.message : 'request_failed';
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
function loadSession() {
  try {const existing = sessionStorage.getItem('axp-publisher-session'); if (existing && /^session-[\w-]+$/.test(existing)) return existing;} catch {}
  return uid('session');
}
function storeSession(value: string) {try {sessionStorage.setItem('axp-publisher-session', value);} catch {}}

function NativeSponsor({award, deliveryToken, acknowledge, onObserved, onReceipt, onError}: {
  award: Award; deliveryToken: string;
  acknowledge: (node: HTMLElement, award: Award, deliveryToken: string) => Promise<ReceiptResult>;
  onObserved: (observation: RenderObservation) => void; onReceipt: (result: ReceiptResult) => void; onError: (error: unknown) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callbacks = useRef({acknowledge, onObserved, onReceipt, onError}); callbacks.current = {acknowledge, onObserved, onReceipt, onError};
  useEffect(() => {
    const host = container.current; if (!host) return;
    let node: HTMLElement;
    try {node = createSponsoredCard({document, award, className: 'ld-ad pub-sponsored'}); host.replaceChildren(node);}
    catch (error) {callbacks.current.onError(error); return;}
    callbacks.current.onObserved(inspectPlacement(node, award));
    void callbacks.current.acknowledge(node, award, deliveryToken).then(result => callbacks.current.onReceipt(result), error => callbacks.current.onError(error));
    return () => {node.remove();};
  }, [award, deliveryToken]);
  return <div ref={container} data-placement-id="chat-sponsored-card" />;
}

export function PublisherDemo() {
  const [config, setConfig] = useState<Config>();
  const [connectionError, setConnectionError] = useState<string>();
  const csrf = useRef('');
  const [sessionId, setSessionId] = useState('');
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [requirement, setRequirement] = useState('');
  const [excluded, setExcluded] = useState('');
  const scrollIntent = useRef<{away: boolean; pointer: boolean; lastTop: number; touchY?: number} | null>(null);
  const conversation = useRef<HTMLDivElement>(null);
  const followingLatest = useRef(true);
  const composer = useRef<HTMLTextAreaElement>(null);
  const releasedAwards = useRef(new Set<string>());
  const acknowledger = useRef<ReturnType<typeof createRenderAcknowledger> | null>(null);
  if (!acknowledger.current) acknowledger.current = createRenderAcknowledger({post: (path, body, token) => productRequest<ReceiptResult>(`/demo${path}`, {body, csrf: csrf.current, deliveryToken: token, timeoutMs: 45000})});
  const patch = useCallback((turnId: string, update: Partial<Turn>) => setTurns(rows => rows.map(row => row.input.turnId === turnId ? {...row, ...update} : row)), []);
  const connect = useCallback(async () => {
    setConnectionError(undefined);
    try {
      const [bootstrap, info] = await Promise.all([productRequest<{csrf: string}>('/bootstrap'), productRequest<Config>('/publisher/config')]);
      if (!bootstrap.csrf || !info.publisherId || !info.placementId) throw new Error('publisher_configuration_missing');
      csrf.current = bootstrap.csrf; setConfig(info);
    } catch (error) {setConnectionError(err(error));}
  }, []);
  useEffect(() => {const value = loadSession(); setSessionId(value); storeSession(value); void connect();}, [connect]);
  const latestTurn = turns[turns.length - 1];
  useEffect(() => {
    const scroll = () => {if (!scrollIntent.current?.away && conversation.current) conversation.current.scrollTop = conversation.current.scrollHeight;};
    scroll();
    let frame = requestAnimationFrame(() => {scroll(); frame = requestAnimationFrame(scroll);});
    return () => cancelAnimationFrame(frame);
  }, [latestTurn?.input.turnId, latestTurn?.answer, latestTurn?.domObservation?.domInserted, latestTurn?.receipt?.charge.id]);
  async function snapshot(turnId: string, phase: 'budgetAfterAward' | 'budgetAfterDelivery') {
    patch(turnId, {budgetLoading: true});
    try {const budget = await productRequest<WorkspaceState>('/state'); patch(turnId, {[phase]: budget, budgetFetchedAt: Date.now(), budgetError: undefined});}
    catch (error) {patch(turnId, {budgetError: err(error)});}
    finally {patch(turnId, {budgetLoading: false});}
  }
  // A failed organic call cannot turn a held award into a billable card.
  useEffect(() => {
    for (const turn of turns) {
      if (!turn.answerError || turn.ad?.status !== 'awarded' || releasedAwards.current.has(turn.ad.award.id)) continue;
      const ad = turn.ad; releasedAwards.current.add(ad.award.id);
      patch(turn.input.turnId, {awardRelease: 'pending'});
      void productRequest(`/demo/awards/${encodeURIComponent(ad.award.id)}/fail`, {body: {reason: 'organic_answer_failed'}, csrf: csrf.current, deliveryToken: ad.deliveryToken})
        .then(() => {patch(turn.input.turnId, {awardRelease: 'released', renderState: 'failed'}); void snapshot(turn.input.turnId, 'budgetAfterDelivery');}, error => patch(turn.input.turnId, {awardRelease: 'error', renderState: 'error', renderError: err(error)}));
    }
  }, [turns, patch]);

  async function requestAd(input: OpportunityInput) {
    patch(input.turnId, {adState: 'pending', adError: undefined});
    try {
      const ad = await productRequest<OpportunityResult>('/demo/chat', {body: input, csrf: csrf.current});
      if (!['awarded', 'no_fill'].includes(ad.status)) throw new Error('invalid_ad_response');
      patch(input.turnId, {ad, adReceivedAt: Date.now(), adState: 'done', ...(ad.status === 'awarded' ? {renderState: 'pending' as const} : {})});
      void snapshot(input.turnId, 'budgetAfterAward');
    } catch (error) {patch(input.turnId, {adError: err(error), adState: 'done'});}
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!question.trim() || pending || !organicReady || !config || !csrf.current) return;
    const input: OpportunityInput = {question: question.trim(), sessionId, turnId: uid('turn'), placementId: config.placementId,
      ...(requirement ? {requiredCapabilities: [requirement]} : {}), ...(excluded ? {excludedCategories: [excluded]} : {})};
    followingLatest.current = true;
    scrollIntent.current = {away: false, pointer: false, lastTop: 0};
    setTurns(rows => [...rows, {input, submittedAt: Date.now(), adState: adsEnabled ? 'pending' : 'disabled'}]); setSelected(input.turnId); setQuestion(''); setBusy(true);
    const answer = (async () => {
      try {
        const value = await productRequest<Answer>('/demo/answer', {body: {question: input.question, sessionId, turnId: input.turnId}, csrf: csrf.current, timeoutMs: 40000});
        if (!value.answer || value.advertiserMaterialIncluded !== false || value.answerMode !== 'actual-api-model' || value.replayed) throw new Error('fresh_live_answer_required');
        patch(input.turnId, {answer: value, answerReceivedAt: Date.now()});
      } catch (error) {patch(input.turnId, {answerError: err(error)});}
    })();
    const ad = adsEnabled ? requestAd(input) : Promise.resolve();
    await Promise.allSettled([answer, ad]); setBusy(false);
  }
  async function retryAd(turn: Turn) {setBusy(true); await requestAd(turn.input); setBusy(false);}
  async function retryRender(turn: Turn) {
    if (turn.ad?.status !== 'awarded') return;
    const ad = turn.ad;
    const node = document.querySelector<HTMLElement>(`[data-award-id="${CSS.escape(ad.award.id)}"]`);
    const observation = inspectPlacement(node, ad.award);
    if (!observation.domInserted || !observation.sponsoredLabelPresent) {patch(turn.input.turnId, {renderState: 'error', renderError: 'render_not_observed'}); return;}
    patch(turn.input.turnId, {renderState: 'pending', renderError: undefined, domObservation: observation});
    try {const receipt = await productRequest<ReceiptResult>(`/demo/awards/${encodeURIComponent(ad.award.id)}/render`, {body: observation, csrf: csrf.current, deliveryToken: ad.deliveryToken, timeoutMs: 45000}); patch(turn.input.turnId, {receipt, renderState: 'accepted', receiptReceivedAt: Date.now()}); void snapshot(turn.input.turnId, 'budgetAfterDelivery');}
    catch (error) {patch(turn.input.turnId, {renderState: 'error', renderError: err(error)});}
  }
  const pending = busy || turns.some(t => t.renderState === 'pending' || t.awardRelease === 'pending');
  const organicReady = config?.organic?.ready === true && config.organic.execution === 'actual-api-model';
  const financialMode = financialModeOf(config);
  const inspected = turns.find(t => t.input.turnId === selected) ?? turns[turns.length - 1];
  function fresh() {if (pending) return; const value = uid('session'); setSessionId(value); storeSession(value); setTurns([]); setSelected(undefined);}
  function choosePrompt(value: string) {setQuestion(value); composer.current?.focus();}
  function intent() {return scrollIntent.current ?? (scrollIntent.current = {away: false, pointer: false, lastTop: conversation.current?.scrollTop ?? 0});}
  function peek(turnId: string) {setSelected(turnId); const panel = document.getElementById('publisher-peek'); panel?.setAttribute('tabindex', '-1'); panel?.focus({preventScroll: true}); panel?.scrollIntoView({block: 'nearest', behavior: 'auto'});}

  return <div className="ld pub-demo">
    <header className="pub-header"><Ld.Wordmark href="/" Link={Link} /><nav aria-label="Product"><Link href="/advertiser-dashboard">Advertiser dashboard →</Link></nav></header>
    <main className="pub-main" id="main">
      <Ld.PageBar title="Ask freely. See the exchange at work." sub="A fresh DeepSeek answer, a separate Sponsored card, and the complete live buying flow." actions={<Ld.Button variant="secondary" onClick={fresh} disabled={pending || !sessionId}>New conversation</Ld.Button>} meta={<Ld.Tag tone="brand">Live publisher app</Ld.Tag>} />
      <div className="pub-mode"><Ld.Tag tone="warning">{financialMode === 'synthetic' ? 'Synthetic test credits' : financialMode === 'devnet' ? 'Solana Devnet test USDC' : financialMode || 'Connecting financial mode'}</Ld.Tag><span>{financialMode === 'synthetic' ? 'No real funding or blockchain settlement.' : 'Financial mode comes from the exchange.'}</span><Ld.Tag tone={config?.engine?.ready ? 'success' : 'outline'}>{config?.engine?.ready ? 'Jev ready' : 'Jev unavailable'}</Ld.Tag><span>{config?.engine?.reason ?? 'Buying engine and financial mode are independent.'}</span></div>
      {connectionError ? <div className="pub-connection" role="alert"><b>Local API unavailable</b><p>Start the product server with <code>npm run demo:product</code>, then reconnect. Details: {connectionError}</p><Ld.Button variant="secondary" onClick={() => void connect()}>Reconnect</Ld.Button></div> : null}
      {config && !organicReady && !connectionError ? <div className="pub-connection pub-provider-setup" role="status"><div><b>Connect DeepSeek to start chatting</b><p>This chat sends a fresh organic model request on every submission. Configure the server’s <code>DEEPSEEK_API_KEY</code> and restart the product server. No fixture answer replaces it.</p><span className="ld-caption">{config.organic?.reason || 'Organic provider unavailable or not configured for live execution.'}</span></div><div className="pub-stack"><Ld.Button href="/publisher-demo/integration" variant="secondary" Link={Link}>Integration and setup →</Ld.Button><Ld.Button variant="ghost" onClick={() => void connect()}>Check readiness</Ld.Button></div></div> : null}
      <div className="pub-grid">
        <section className="ld-panel pub-chat" aria-label="Publisher chat">
          <div className="ld-panel-head"><div className="ld-panel-titles"><h2 className="ld-card-title">AXP chat</h2><span className="ld-caption">DeepSeek answers. Advertiser agents compete for a separate placement.</span></div><Ld.Tag tone={organicReady ? 'success' : 'outline'}>{organicReady ? config?.organic?.model || 'DeepSeek ready' : 'Organic setup required'}</Ld.Tag></div>
          <div ref={conversation} className="pub-conversation" aria-live="polite" aria-atomic="false" tabIndex={0} aria-label="Conversation"
            onWheel={event => {const state = intent(), node = conversation.current; if (event.deltaY < 0) state.away = true; else if (node && node.scrollHeight - node.scrollTop - node.clientHeight - event.deltaY < 100) state.away = false;}}
            onPointerDown={() => {intent().pointer = true;}}
            onPointerUp={() => {intent().pointer = false;}}
            onTouchStart={event => {intent().touchY = event.touches[0]?.clientY;}}
            onTouchMove={event => {const state = intent(), y = event.touches[0]?.clientY; if (y !== undefined && state.touchY !== undefined && y > state.touchY) state.away = true; state.touchY = y;}}
            onKeyDown={event => {if (['ArrowUp', 'PageUp', 'Home'].includes(event.key) || event.key === ' ' && event.shiftKey) intent().away = true; else if (event.key === 'End') intent().away = false;}}
            onScroll={() => {const node = conversation.current, state = intent(); if (node && state.pointer) {if (node.scrollTop < state.lastTop) state.away = true; if (node.scrollHeight - node.scrollTop - node.clientHeight < 20) state.away = false;} if (node) state.lastTop = node.scrollTop;}}>
            {!turns.length ? <div className="pub-welcome"><span className="pub-welcome-mark" aria-hidden>↗</span><h2 className="ld-section-title">What are you deciding today?</h2><p>Pick a question below, edit it, and send. Active campaigns in the <Link href="/advertiser-dashboard">advertiser dashboard</Link> can compete for a disclosed card. Your answer remains independent of the winner.</p><span className="ld-label">Suggested questions · click to edit</span><div className="pub-examples">{(config?.sampleQuestions ?? ['Compare hardware wallets for Ethereum and Solana with offline key storage.', 'Recommend a developer tool to debug and build a TypeScript API.']).map(q => <button key={q} type="button" onClick={() => choosePrompt(q)}>{q} →</button>)}</div></div> : turns.map((turn, index) => <article key={turn.input.turnId} className="pub-turn">
              <div className="pub-user"><span className="ld-caption">You · turn {index + 1}</span><p>{turn.input.question}</p></div>
              <div className="pub-answer"><div className="pub-answer-head"><b>DeepSeek</b>{turn.answer ? <Ld.Tag tone="success">{turn.answer.model || 'Live model answer'}</Ld.Tag> : null}</div>
                {turn.answer ? <><p>{turn.answer.answer}</p><span className="ld-caption">Fresh answer generated without sponsor material.</span></> : turn.answerError ? <><p role="alert">Organic provider failed: {turn.answerError}. No replacement answer was fabricated.</p><Ld.Button variant="ghost" disabled={pending} onClick={() => choosePrompt(turn.input.question)}>Edit and send as a new turn</Ld.Button></> : <p role="status" className="ld-muted">DeepSeek request in progress. The ad lane runs independently.</p>}
              </div>
              <div className="pub-slot">
                {turn.ad?.status === 'awarded' && turn.answer ? <><NativeSponsor award={turn.ad.award} deliveryToken={turn.ad.deliveryToken} acknowledge={(node, award, token) => acknowledger.current!({node, award, deliveryToken: token})} onObserved={domObservation => patch(turn.input.turnId, {domObservation})} onReceipt={receipt => {patch(turn.input.turnId, {receipt, renderState: 'accepted', receiptReceivedAt: Date.now(), renderError: undefined}); void snapshot(turn.input.turnId, 'budgetAfterDelivery');}} onError={error => patch(turn.input.turnId, {renderState: 'error', renderError: err(error)})} />
                  <div className="pub-delivery"><Ld.Tag tone={turn.renderState === 'accepted' ? 'success' : turn.renderState === 'error' ? 'warning' : 'outline'}>{turn.renderState === 'accepted' ? 'Delivery accepted' : turn.renderState === 'error' ? 'Delivery unconfirmed' : 'Recording DOM observation'}</Ld.Tag><span>{turn.renderState === 'accepted' ? `${money(turn.receipt?.charge.amountBaseUnits ?? turn.ad.award.priceBaseUnits)} ${moneyUnit(financialModeOf(turn.receipt, turn.ad, turn.budgetAfterDelivery, config))} accrued` : turn.renderError ?? 'Exact approved text and Sponsored disclosure checked.'}</span></div></> : turn.ad?.status === 'awarded' ? <div className="pub-no-fill" role="status"><b>{turn.answerError ? 'Sponsored card omitted' : 'Sponsored check complete'}</b><span>{turn.answerError ? turn.awardRelease === 'released' ? 'Organic answer failed. The reservation was released with no delivery charge.' : turn.awardRelease === 'error' ? `No card inserted. Reservation release unconfirmed: ${turn.renderError}. Server expiry remains active.` : 'Organic answer failed. The card will not be inserted; releasing the reservation.' : 'Award ready. Waiting for the independent answer before inserting the Sponsored card.'}</span></div> : turn.adState === 'pending' ? <div className="pub-no-fill" role="status">Ad request in progress. Your answer is independent.</div> : turn.adError ? <div className="pub-no-fill"><b>Ad request failed</b><span>{turn.adError}. The answer remains independent.</span><Ld.Button variant="ghost" disabled={pending} onClick={() => void retryAd(turn)}>Retry ad on this same turn</Ld.Button></div> : turn.adState === 'disabled' ? <div className="pub-no-fill">Sponsored cards were disabled for this turn.</div> : <div className="pub-no-fill"><b>No sponsored placement</b><span>No eligible award for this question. Peek inside for the actual reasons.</span></div>}
              </div>
              <div className="pub-turn-foot"><button type="button" onClick={() => peek(turn.input.turnId)} aria-controls="publisher-peek" aria-pressed={inspected?.input.turnId === turn.input.turnId}>Peek inside turn {index + 1} →</button>{turn.ad?.status === 'awarded' && turn.answer && turn.renderState !== 'pending' ? <button type="button" disabled={pending} onClick={() => void retryRender(turn)}>{turn.receipt ? 'Replay same receipt' : 'Retry delivery acknowledgement'}</button> : null}</div>
            </article>)}
          </div>
          <form className="pub-composer" onSubmit={event => void submit(event)}><label htmlFor="publisher-question" className="ld-label">Your question</label><textarea ref={composer} id="publisher-question" className="ld-textarea" value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={event => {if (event.nativeEvent.isComposing) return; if (event.key === 'Tab' && !event.shiftKey && !question.trim()) {event.preventDefault(); setQuestion(config?.sampleQuestions?.find(q => /hardware wallets?/i.test(q)) ?? 'Compare hardware wallets for Ethereum and Solana with offline key storage.');} else if (event.key === 'Enter' && !event.shiftKey) {event.preventDefault(); event.currentTarget.form?.requestSubmit();}}} placeholder="Ask anything, or press Tab for a suggested question." rows={3} maxLength={1200} required aria-describedby="publisher-send-hint" /><div className="pub-composer-foot"><span id="publisher-send-hint" className="ld-caption">{organicReady ? 'Tab to use suggested question · Enter to send · Shift+Enter new line' : 'Set up DeepSeek to enable sending. Tab autofills an editable question.'}</span><Ld.Button type="submit" disabled={pending || !organicReady || !config || !sessionId || !question.trim() || !!connectionError}>{pending ? 'Requests in progress' : organicReady ? 'Send question →' : 'DeepSeek setup required'}</Ld.Button></div></form>
        </section>
        <aside className="pub-aside" aria-label="Publisher controls and delivery trace">
          <div className="pub-peek"><PeekInside turn={inspected} number={inspected ? turns.indexOf(inspected) + 1 : undefined} financialMode={financialMode} onRefreshBudget={inspected ? () => void snapshot(inspected.input.turnId, inspected.receipt || inspected.awardRelease ? 'budgetAfterDelivery' : 'budgetAfterAward') : undefined} /></div>
          <Ld.Panel title="Publisher setup" sub={config?.publisherId ?? 'Connecting to the local API'}><div className="pub-stack"><label className="pub-check"><input type="checkbox" checked={adsEnabled} onChange={e => setAdsEnabled(e.target.checked)} disabled={pending} /> Enable sponsored cards</label><Ld.Field label="Required capability" hint="Optional publisher requirement. Campaign declarations must satisfy it."><select className="ld-select" value={requirement} onChange={e => setRequirement(e.target.value)} disabled={pending}><option value="">Infer from the question</option>{config?.capabilities?.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Ld.Field><Ld.Field label="Excluded category"><select className="ld-select" value={excluded} onChange={e => setExcluded(e.target.value)} disabled={pending}><option value="">No extra category exclusion</option>{config?.capabilities?.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Ld.Field><p className="ld-caption">Keep the conversation to observe campaign frequency limits. New conversation changes the session and keeps campaign spend.</p><details className="pub-details"><summary>Session and placement</summary><dl><dt>Session</dt><dd className="ld-mono">{sessionId || 'Initializing'}</dd><dt>Placement</dt><dd className="ld-mono">{config?.placementId || 'chat-sponsored-card'}</dd><dt>Buyer engine</dt><dd>{config?.engine?.id ?? 'Unavailable'}</dd></dl></details></div></Ld.Panel>
        </aside>
      </div>
      <footer className="pub-footer"><Link href="/publisher-demo/integration">Technical integration →</Link></footer>
    </main>
  </div>;
}
