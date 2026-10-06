# Advertiser dashboard journeys

This surface creates and operates new persisted campaigns. The public entry is
`/advertiser-dashboard`. Ledger v2 supplies the visual language and components.
The workspace uses synthetic test credits, with no wallet, bank funding or
blockchain transaction. Actual campaign buying decisions use Jev when configured;
provider readiness and provenance are labelled explicitly.

## First campaign

1. An empty workspace explains the purchased event: a disclosed Sponsored card
   inserted into a participating publisher app. The operator creates an agency workspace
   with a name and website. One workspace can manage distinct advertisers; each
   advertiser is identified by its brand and website origin. No invented performance appears.
2. Create a campaign from a blank draft or an explicitly labelled example preset.
   A five-step editor groups Offer, Context, Creative, Spend and Review.
3. Offer records the campaign name, brand, destination and product description.
   Context records advertiser-authored hints that guide Jev, separately from
   factual capability declarations used for hard eligibility. These editable hints
   are not retrieved ContextHint historical evidence or audience identities.
4. Creative shows the exact approved Sponsored text beside the editor. A question
   can be checked against deterministic eligibility and copy rules. Preview does
   not invoke Jev, predict a win or count as delivery. Actual Jev judgment happens
   when a publisher submits an opportunity.
5. Spend uses decimal test-credit inputs converted exactly to six-decimal integer
   strings. The backend enforces maximum bid, total campaign cap and deposit.
6. Review summarizes the saved offer, contexts, creative and limits. Launch is an
   explicit action against the saved draft after a review acknowledgement and
   stored creative approval. Editing invalidates approval; launched versions are
   immutable. An error preserves the editable draft.
7. After launch, a clear next action opens the publisher demo, where the campaign
   can compete and a browser can acknowledge insertion. Delivery and spend appear
   only after the backend accepts the corresponding records.

## Returning advertiser

The campaign list offers status/search filters and saved drafts. Open a draft to
resume the editor. Open an operating campaign to see its actual delivered cards,
available cap, reserved awards, accepted spend, cumulative authorization,
synthetic settlement and refund. Reservations are not charges; authorization and
settlement do not add spend. Pause stops new competition;
resume reopens it. Duplicate creates a separate draft. Refresh reconciles server
state without inventing progress. The account can be edited separately.

## Failure and evidence boundaries

API unavailability has a retry action and preserves local edits. Validation errors
attach to fields; the editor focuses the first invalid field. Mutation failures
remain visible and do not claim success. Busy controls prevent repeat submissions.
A saved draft is distinguished from unsaved changes. Empty delivery tables explain
how to create a real event using the publisher demo. Delivery means card insertion,
not attention, impressions, clicks or conversions. No chart or effectiveness metric
is fabricated. Money labels consistently identify synthetic test credits.

## Interaction and layout

The shell separates Campaigns, Account and publisher testing. Primary actions stay
near the task. The editor offers Back, Save draft and Continue, with a sticky live
creative preview on wide screens and stacked panels on mobile. All controls have
labels, visible focus, keyboard operation and reduced-motion support.


## Keyboard presentation journey

The isolated presentation workspace starts with three prepared, active fictional
hardware-wallet advertisers. The presenter creates HarborKey as a fourth advertiser
and launches its first campaign; the UI never manufactures a fourth saved record.

1. Enable the explicit **Demo autofill** switch and select **Create advertiser &
   campaign**. The blank Offer step focuses its campaign-name field.
2. Press Tab in an empty named text field to apply the HarborKey suggestions to
   empty fields on that step. The next Tab follows normal focus navigation. Filled
   fields, Shift+Tab, buttons, selects, capability search and review checkboxes keep
   ordinary keyboard behavior. **Fill this step** offers the same visible action.
3. HarborKey's suggested offer is a hardware wallet with offline key storage and
   Ethereum/Solana support, at `https://harborkey.example/`. Suggestions are editable
   and carry no backend or model authority until saved, approved and launched.
4. On Context, Tab in the empty hints textarea adds advertiser-authored Jev guidance.
   This does not silently declare capabilities. Tab to **Use suggested capabilities**
   and press Enter to explicitly apply Crypto custody, Hardware wallets, Offline key
   storage, Ethereum and Solana declarations.
5. On Creative, Tab in the empty approved-text field adds the exact separate
   Sponsored copy. On Spend, Tab in an empty amount field applies suggested limits.
   **Fill this step** also populates empty spend fields. Existing amounts are never
   overwritten by keyboard suggestions.
6. Review the fourth advertiser, hints, declarations, exact copy and limits. Check
   the approval acknowledgement and activate Launch explicitly. Tab never saves,
   approves, launches, purchases or settles.
7. Open Publisher chat. Its separate demo mode can fill an empty composer with Tab;
   Enter submits a fresh question for independent DeepSeek generation and the full
   ad opportunity flow. Open **Peek inside** to inspect actual eligibility, Jev,
   evidence, bids, award, insertion and accepted receipt. A preset question does not
   force a winning advertiser.

The publisher SDK is available for technical review. It is outside this presentation
journey. Seeded inventory and keyboard suggestions do not modify the original MVP
recordings or campaign identity.
