export type Capability = { id: string; label: string; description?: string };
export type Draft = { id?: string; name: string; brandName: string; websiteURL: string; productDescription: string; approvedText: string; contextHints: string[]; declaredCapabilities: string[]; maxBidBaseUnits: string; budgetCapBaseUnits: string; depositBaseUnits: string };
export type Campaign = Draft & { id: string; advertiserId?: string; status: string; createdAt?: string; updatedAt?: string; approved?: boolean; approvedContentHash?: string; deliveryCount?: number; reservedBaseUnits?: string; refundBaseUnits?: string; spendBaseUnits?: string; acceptedBaseUnits?: string; authorizedBaseUnits?: string; settledBaseUnits?: string; remainingBaseUnits?: string; metrics?: Record<string, string | number> };
export type Delivery = { id?: string; campaignId: string; createdAt?: string; question?: string; status?: string; priceBaseUnits?: string; amountBaseUnits?: string; [key: string]: unknown };
export type ProductState = { advertisers?: Array<{id: string; brandName: string; websiteURL: string; workspaceId: string; createdAt: string}>; mode: string; account: { id?: string; name: string; websiteURL: string } | null; campaigns: Campaign[]; drafts?: Campaign[]; summary?: Record<string, string | number>; deliveries: Delivery[]; events: Array<{ id?: string; campaignId?: string; type?: string; createdAt?: string; message?: string; [key: string]: unknown }> };
export type Bootstrap = { demo?: { enabled: boolean; seededAdvertiserCount: number; advertiserSuggestion?: Draft }; engine?: { id: string; execution: string; ready: boolean; reason: string | null }; financialMode?: string; limits?: { floorBaseUnits: string; maxBidBaseUnits: string; maxBudgetBaseUnits: string; frequencyCap: number }; csrf: string; mode: string; capabilities: Capability[]; presets: Array<Partial<Draft> & { id?: string; label?: string; exampleQuestion?: string; campaign?: Partial<Draft> }> };
export type Preview = { eligible?: boolean; reason?: string; question?: string; matchedHints?: string[]; creative?: { brandName?: string; text?: string; websiteURL?: string }; [key: string]: unknown };
export function draftFields(value: Draft): Draft { return { id: value.id, name: value.name, brandName: value.brandName, websiteURL: value.websiteURL, productDescription: value.productDescription, approvedText: value.approvedText, contextHints: [...value.contextHints], declaredCapabilities: [...value.declaredCapabilities], maxBidBaseUnits: value.maxBidBaseUnits, budgetCapBaseUnits: value.budgetCapBaseUnits, depositBaseUnits: value.depositBaseUnits }; }
export const blankDraft = (): Draft => ({ name: '', brandName: '', websiteURL: '', productDescription: '', approvedText: '', contextHints: [], declaredCapabilities: [], maxBidBaseUnits: '1000', budgetCapBaseUnits: '100000', depositBaseUnits: '100000' });
/** Decimal strings stay exact: no floating point arithmetic handles spending limits. */
export function toBaseUnits(value: string): string | null {
  if (!/^\d+(?:\.\d{0,6})?$/.test(value.trim())) return null;
  const [whole, fraction = ''] = value.trim().split('.');
  return (BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, '0'))).toString();
}
export function decimal(value?: string | number): string {
  const raw = String(value ?? '0');
  if (!/^\d+$/.test(raw)) return '0';
  const n = BigInt(raw), fraction = (n % 1000000n).toString().padStart(6, '0').replace(/0+$/, '');
  return `${n / 1000000n}${fraction ? `.${fraction}` : ''}`;
}
export function amount(c: Campaign, kind: 'spend' | 'settled' | 'remaining'): string {
  if (kind === 'spend') return String(c.spendBaseUnits ?? c.acceptedBaseUnits ?? c.metrics?.spendBaseUnits ?? '0');
  if (kind === 'settled') return String(c.settledBaseUnits ?? c.metrics?.settledBaseUnits ?? '0');
  const used = amount(c, 'spend');
  const available = BigInt(c.budgetCapBaseUnits || '0') - BigInt(used) - BigInt(c.reservedBaseUnits ?? '0');
  return String(c.remainingBaseUnits ?? (available > 0n ? available : 0n));
}
export function count(c: Campaign, deliveries: Delivery[]): number { return Number(c.deliveryCount ?? c.metrics?.deliveryCount ?? deliveries.filter(d => d.campaignId === c.id).length); }
export function campaignRows(state: ProductState): Campaign[] { return [...state.campaigns, ...(state.drafts ?? []).filter(d => !state.campaigns.some(c => c.id === d.id))]; }
export function date(value?: string): string { return value ? new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Saved'; }
export async function api<T>(path: string, csrf?: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/product${path}`, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', headers: body === undefined ? undefined : { 'content-type': 'application/json', 'x-axp-csrf': csrf ?? '' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await response.json().catch(() => null);
  if (!response.ok) {
    const raw = typeof value?.error === 'string' ? value.error : value?.error?.message ?? value?.message ?? `Request failed (${response.status}). Please try again.`;
    const messages: Record<string, string> = { invalid_url: 'Use an https website URL without embedded credentials.', invalid_text: 'Check the text fields for missing values or unsupported characters.', spend_limit_exceeded: 'An amount exceeds the demo spending limit. Check your campaign limits.', invalid_budget: 'Maximum bid must meet the minimum and fit inside both the campaign cap and allocation.', capabilities_required: 'Declare at least one capability your offer supports.', context_hints_required: 'Add at least one advertiser hint to guide Jev.', complete_onboarding: 'Create your advertiser account before launching a campaign.', campaign_not_approved: 'Review and approve your campaign before launching.', launched_campaign_immutable: 'Launched campaigns cannot be edited. Duplicate this campaign to create a new draft.', channel_closed: 'This campaign is closed. Duplicate it to launch a new campaign.', jev_unavailable: 'Jev is unavailable. The backend must configure the buying engine before this campaign can compete.', csrf_invalid: 'Your workspace session expired. Reload the page and try again.' };
    throw new Error(messages[raw] ?? raw.replaceAll('_', ' '));
  }
  return value as T;
}
