# Publisher journeys

Written before implementation for the first user-operated AXP publisher integration.
The publisher is the AI app operator. Advertisers create campaigns in the new
dashboard; this chat requests the same live local inventory. Saved V3 recordings
remain separate read-only evidence.

## Developer: connect an AI app

1. Read publisher configuration: publisher ID, financial mode, buyer-engine
   readiness, supported placement and capabilities. Obtain a publisher key from the local server setup and put it
   in a server environment variable. No key enters the browser or model context.
2. Import the dependency-free Node SDK. Keep one random session ID per conversation
   and one stable turn ID per user submission. Declare required capabilities and
   category exclusions when the app knows them.
3. Start the ad request alongside the app's existing answer request. The answer
   receives only the conversation; no advertiser creative, context hints,
   retrieved historical evidence or bid context enters its prompt. The buying path
   independently evaluates eligible user-created campaigns through Jev when
   configured, with actual engine provenance and errors exposed in the trace.
   Display answer tokens or the completed answer immediately when available.
4. An award reserves its exact price. Render a separate native card using the
   approved text, destination and literal Sponsored label. A no-fill or request
   error or deadline leaves the organic response usable and the slot empty.
5. Inspect the connected DOM, exact text, destination, disclosure and award binding.
   Only then send the observation through the app's backend with the scoped delivery
   token. The backend signs the receipt; browser code has no signing authority.
6. Inspect accepted receipt, charge and campaign spend. A reservation is not spend;
   accepted synthetic accrual is not settlement or real money. Rendering proves
   the app's observation, not human attention, conversion or endorsement.

## Chat user: ask and understand sponsorship

1. Open the reference publisher chat and ask an arbitrary question. Example prompts
   help discover supported inventory, but no fixed scenario runs automatically.
2. Choose a suggested question to autofill the composer, or press Tab in an empty
   composer for the hardware-wallet question. Edit it, then press Enter to send;
   Shift+Enter inserts a line, and subsequent Tab/Shift+Tab keep normal focus navigation. Each
   send creates a fresh turn and a fresh DeepSeek organic request. Without configured
   DeepSeek, sending is disabled with a setup requirement; no fixture is passed off
   as a live answer. A configured organic adapter uses only the sanitized question.
3. If an eligible active dashboard campaign wins, see its separate Sponsored card.
   Open its HTTPS destination optionally; no click is required for delivery.
4. See a clear no-fill when inventory, policy, frequency or budget prevents an award.
   Open “Peek inside” to inspect eligibility, observed/inferred evidence, actual buyer engine, decisions, campaign hints,
   exclusions and deadlines. Real Jev decisions and synthetic financial accounting
   are independent labels; one never implies the other.
5. Continue asking questions in the same session to exercise frequency limits.
   Start a fresh conversation to create a new random session and empty chat history.
   This changes conversation frequency scope; it never resets campaign spend.

## Failure and recovery

| Situation | User experience | Integration behavior |
| --- | --- | --- |
| Ads time out or API fails | Answer remains usable; ad path shows its failure | No automatic new purchase; retry explicitly with the original session and turn |
| DeepSeek unavailable | Composer explains the missing provider and links integration help | Sending is disabled; no deterministic replacement |
| DeepSeek fails after a send | Honest organic error, independent ad result | No automatic organic call replay; a new submission is a new turn |
| No campaign matches | Answer plus concise no-fill state | No card, receipt or charge |
| Creative or disclosure differs | Card delivery is not acknowledged | Explicit render failure; preserve organic answer |
| Receipt request is uncertain | Card remains, delivery status says unconfirmed | Retry the same award/token/observation; server returns the original accepted result |
| Award expires before acknowledgement | Delivery is rejected; no success claim | No replacement purchase on that turn |
| App omits or cannot render an award | Organic answer remains | Explicit fail releases reservation, otherwise server expiry does |
| Browser refresh | New turns use the existing random conversation session | No automatic replay or new purchase |

## Acceptance story

Create and activate a campaign in the advertiser dashboard. Ask a matching question
in `/publisher-demo`, inspect the actual Jev decision provenance, award and separate card, then inspect the accepted
receipt and dashboard accrual. Repeat two fresh turns in the same session to observe
frequency policy; ask an unrelated question for no-fill. Pause the campaign and
ask again. Retry one accepted render and confirm its charge ID is unchanged.
Do not infer payment network activity from this synthetic workflow.

## Research reference

The developer lifecycle is informed by Gravity's official
[overview](https://docs.trygravity.ai/introduction/overview),
[AI platform quickstart](https://docs.trygravity.ai/ai-platforms/quickstart),
[JavaScript and React SDK guide](https://docs.trygravity.ai/sdks/javascript), and
[rendering guide](https://docs.trygravity.ai/ai-platforms/show-ads), reviewed
2026-10-07. These establish the useful parallel server request and native disclosed
rendering pattern. AXP's API, exact render receipts, explicit retry identities and
synthetic accounting are its own implementation. No Gravity code or pixel is used.
