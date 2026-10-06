# User-operated product demo

The new advertiser dashboard and publisher chat use a persisted local workspace.
They are additive to the existing MVP explorer, saved V3 runs, verification pages,
presentation and recorded Devnet evidence. Those original artifacts remain separate
from the new product workspace; their campaigns and money are never merged.

## What is live and what is synthetic

| Path | Current behavior | Evidence to show |
| --- | --- | --- |
| Advertiser setup | Saved account, editable drafts, advertiser-authored hints, declared capabilities, approved creative and immutable launched campaign | Dashboard campaign and its saved values |
| Organic answer | A fresh independent `deepseek-flash` API request for each newly submitted turn when DeepSeek is configured | Answer model and `answerMode: actual-api-model`; no advertiser material in its supplied prompt |
| Buying decision | Eligible campaigns are evaluated through Jev; advertiser-authored hints are separate model inputs | Decision provenance, declared hints, exclusions and retrieved evidence in the turn trace |
| Card delivery | Approved copy is inserted with a separate literal Sponsored label; the app acknowledges exact insertion | Accepted signed receipt and one charge ID |
| Financial accounting | Synthetic six-decimal test credits: reservation, accepted charge, cumulative authorization, settlement and refund | Dashboard money states; financial mode remains `synthetic` |
| Prepared Devnet wallet | Separate disposable wallet preparation, not connected to this workspace's synthetic channels | Read-only wallet status, separately labelled |

Jev and DeepSeek being real API calls does not make the financial ledger a real
payment channel. A signed receipt authenticates an app insertion/disclosure
assertion. It does not prove human attention, viewability, clicks, conversion or
organic endorsement. A preview is only an eligibility/copy check: `previewOnly`
and `providerCalls: 0`, with no Jev judgment or predicted win.

The coordinator's current wallet handoff reports 20 Circle Devnet test USDC and
0 SOL in the prepared sponsor wallet. This is preparation only. It is not evidence
of a product deposit, accepted delivery, channel opening or settlement. Keep wallet
readiness and product financial mode separate throughout the presentation.

## Local startup

Requirements: Node 22.18+ and installed workspace dependencies. From the repository
root, use the existing ignored `.env.local` configuration for `DEEPSEEK_API_KEY`
and `JEV_API_KEY` (or the supported `TYPESAFE_API_KEY` alias). Process environment
variables override that file. Never put provider keys in `NEXT_PUBLIC_*`, browser
code, screenshots, prompts or committed files.

For the presentation, prepare a separate ignored workspace with three active
fictional hardware-wallet advertisers: ClearVault, KeyArc and ColdNest. Preparation
makes zero provider calls and no native transactions. It does not touch the existing
product workspace or original MVP data.

```sh
node scripts/product/prepare-demo.mjs
AXP_PRODUCT_DEMO_MODE=1 AXP_PRODUCT_STATE_DIR=local-state/product-presentation npm run demo:product
```

The normal blank-workspace command remains `npm run demo:product`. To rehearse the
three-to-four advertiser story again, stop the presentation server and run
`node scripts/product/prepare-demo.mjs --reset`, then restart the command above.
Reset preserves the previous presentation directory as an ignored backup before
preparing the three seeds. Do not reset a running workspace.

The product origin is `http://127.0.0.1:3430`. Its Next UI upstream is port 3432
with polling enabled; interact through port 3430 so UI and API share one origin.
The launcher creates ignored state in the selected product directory, including
the publisher server key and receipt signing key. Startup does not submit an
organic question, buy a placement or sign a wallet transfer. A chat submission
makes a real configured DeepSeek request and can invoke Jev for eligible campaigns.

Open:

- [Advertiser dashboard](http://127.0.0.1:3430/advertiser-dashboard/)
- [Publisher chat](http://127.0.0.1:3430/publisher-demo/)
- [Publisher configuration](http://127.0.0.1:3430/api/product/publisher/config)

Before presenting, check configuration reports `organic.ready: true`, organic
execution `actual-api-model`, model `deepseek-flash`, and Jev readiness. Missing
DeepSeek returns `503 organic_key_unavailable`; the main product has no canned
replacement answer. Do not claim a real answer from an injected fixture, a stored
replay or a configuration value alone. The returned answer and its actual turn
provenance establish what ran.

The current caps are 20 admitted organic requests per UTC day and the configured
Jev daily cap (50 by default). Failed or uncertain provider admissions count. A
same-turn retry does not silently issue a new paid request. A newly submitted user
question has a fresh turn identity and is a new call. An explicit new conversation
changes frequency scope, not campaign spend or daily provider caps.

## Keyboard judge flow

1. Open the dashboard and show the three actual active advertisers: ClearVault,
   KeyArc and ColdNest. The **Demo autofill** switch is enabled by the presentation
   server's explicit demo flag and remains visible and editable. Select **Create
   advertiser & campaign**. A brand and website origin define a distinct advertiser
   inside the agency workspace.
2. The empty Campaign name field receives focus. Press **Tab** once to fill the
   entire blank Offer step with HarborKey launch, HarborKey, its HTTPS website and
   hardware-wallet description. Review the editable values, then Continue (or Enter
   from the field). The next Tab navigates normally. Suggestions never overwrite
   filled fields or intercept Shift+Tab, buttons, selectors or capability search.
3. Context focuses the empty hints textarea. Press **Tab** once to fill the supplied
   advertiser-authored Jev hints. Tab to **Use suggested capabilities** and press
   **Enter** to explicitly declare Crypto custody, Hardware wallets, Offline key
   storage, Ethereum and Solana. Continue. These declarations are hard eligibility
   facts; the hints are model guidance, separate from retrieved ContextHint history.
4. On Creative, press **Tab** in the empty field to fill the exact Sponsored copy:
   “Keep your keys offline with HarborKey. A hardware wallet for Ethereum and Solana
   self-custody.” Inspect the separate live card preview. Previewing or filling
   suggestions does not call Jev, count a delivery or predict a win.
5. On Spend, press **Tab** in the empty amount field to fill 0.004 maximum bid,
   0.016 campaign cap and 0.02 test-credit allocation. Review and Continue. The
   **Fill this step** button provides the same visible alternative on each setup
   step. Existing amounts remain unchanged.
6. Review the fourth advertiser, its hints, declarations, exact copy and limits.
   Explicitly check the approval acknowledgement and Launch. Tab never approves,
   launches or purchases. The backend saves the draft, approval and immutable
   campaign version. The active-advertiser count now comes from four persisted
   advertiser identities, rather than a UI fixture.
7. Open Publisher chat. With its explicit demo autofill enabled, **Tab** in the
   empty composer fills a hardware-wallet comparison question; **Enter** submits a
   fresh turn. The independent DeepSeek answer and complete Jev buying/auction/
   delivery path execute separately. Show the actual `deepseek-flash` answer when
   it arrives, the separate Sponsored card if awarded, and accepted delivery.
8. Open **Peek inside**. Inspect actual candidate eligibility, advertiser hints,
   retrieved evidence or its unavailability, Jev decisions, bid policy, auction,
   award reservation, exact insertion acknowledgement and accepted receipt/charge.
   The question and suggested bids do not force HarborKey to win. If there is
   no-fill, present its recorded reason. Return to the dashboard to show real
   accepted spend, reservation, authorization and synthetic settlement states.

Optional inspection after the core story: replay an accepted receipt to show its
unchanged charge ID; ask a fresh turn to demonstrate the per-conversation frequency
cap; pause an advertiser's campaign and inspect its exclusion. A new conversation
never resets campaign spend. Closing and settling still uses synthetic credits,
not the separately prepared Devnet wallet or original recorded Devnet channels.

## Technical review: publisher SDK

The SDK is outside the judge presentation flow. For a separate technical review,
start its example in a second terminal after the product server has created its
ignored publisher key:

```sh
AXP_EXCHANGE_URL=http://127.0.0.1:3430/api/product \
  node packages/publisher-sdk/examples/server.mjs
```

Open [SDK example](http://127.0.0.1:3433). The server reads the publisher key locally
and keeps it out of the browser. Point its server environment at the selected
presentation workspace key when reviewing that inventory; never print the key. It requests the same user-created campaign
inventory through the reusable SDK. The example forwards an independent question to the live DeepSeek answer endpoint
on the product server and requests ads through the SDK in parallel. It requires
configured DeepSeek and holds an award until the answer arrives. Use the main
publisher chat for the full Peek inside judge flow. SDK ad requests can invoke
configured Jev. The SDK's purpose
here is to show server request, native card rendering and exact receipt forwarding
without changing an app's independent organic model path.

## Failure behavior

- Missing DeepSeek configuration is a setup requirement, not a reference answer.
- A failed or uncertain organic turn is not automatically reissued. Submit a new
  turn explicitly for a fresh call after resolving the failure.
- Missing Jev configuration, malformed model output, a deadline, cap or eligibility
  exclusion has explicit provenance and no forced bid. The organic request remains
  independent.
- An unrendered award is not a charge. Exact accepted insertion/disclosure is needed.
  Explicit failure releases a reservation; otherwise expiry does.
- Reconcile an uncertain receipt using the same award, token and observation. An
  accepted duplicate returns the original charge, rather than purchasing again.
- Editing a draft invalidates approval. Launched campaigns are immutable; duplicate
  into a new draft to revise the offer or hints.

## Focused verification

```sh
node --test tests/product/*.test.mjs
node --test tests/publisher-sdk/*.test.mjs
```

Product tests use isolated temporary SQLite state and injected provider fixtures.
They cover approval invalidation, immutable launch, separate Jev hints/capabilities/
evidence, eligibility exclusions without model calls, exact receipt and monetary
replay, hostile monetary hints, provider response validation, durable uncertain
admissions, fresh organic turns and independent organic prompt construction. The
DeepSeek wire fixture verifies the pinned model, disabled thinking, bounded output,
strict response handling and no automatic retries. These tests make no paid calls
or wallet changes, and do not establish actual provider behavior or decision quality.

Secrets and local state are ignored by `.gitignore` (`.env.*` except `.env.example`,
`local-state/`, private-key PEMs and SQLite files). Preserve those exclusions and
never commit or print their contents. Keep existing MVP/V3 harnesses, replay bundles
and original public routes intact when presenting or extending the new workspace.
