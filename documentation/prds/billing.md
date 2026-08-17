### 1. Overview

The **Billing — Subscription** module allows an ice cream shop to experiment,
Hire and manage the Scoops paywall. The module controls the cycle of
commercial life of the organization, integrates recurring charges with Asaas,
issues tax documents and applies blocks or reactivations depending on the state
confirmed signature.

Billing deals exclusively with the monthly fee for using Scoops. Payments made
by ice cream shop customers, POS payment methods, cashier, change,
sales reconciliation and tax issuance of orders do not belong to this module.

**Objective:** convert ice cream shops who try Scoops into subscribers
payers through a unique, transparent and self-service offer, maintaining
predictability in charges, cancellations, blocking and recovery of access.

**Issue resolved:** without a core subscription module, Scoops has no
a reliable source to determine whether an ice cream shop can access the modules
operations, nor does it offer the Manager clear means to hire, update the
payment, check charges, obtain invoices or cancel.

**Delivered value:** no-obligation test, simple contracting, price
predictable, recurring billing by card or Pix Automatic, recovery of
default without immediate loss of data and autonomy to manage the
signature.

#### Commercial offer confirmed

- **Plan:** `Full Scoops`.
- **Price:** R$59.90 per month, taxes included.
- **Frequency:** exclusively monthly.
- **Scope:** all Scoops features.
- **Limits:** unlimited users, products, orders and movements.
- **Additional fees:** no implementation, membership, cancellation fees,
  user, volume or payment method.
- **Trial:** 14 days free, without advance payment and with access
  integral.
- **Payment methods:** credit card and Pix Automatic.
- **Provider:** Asaas.

---

### 2. Target audience

#### Main audience

Managers of independent ice cream and açaí shops who need to experiment,
contract and maintain the organization's access to Scoops without depending on customer service
commercial.

#### Secondary audiences

- Financial or accounting managers who receive receipts and NFS-e in one
  billing email, without necessarily having access to Scoops.
- Individual or legal entity subscribers responsible for payment.
- Scoops administrative team, which monitors charges and exceptions for
  Asaas dashboard and technical alerts.

#### Not public

- Ice cream shop operators, who cannot view prices, subscriptions,
  charges or tax data.
- Chains that need to hire several ice cream shops under a single contract.
- Customers requiring an annual plan, negotiated price, add-ons, or per-month billing
  consumption.
- Customers looking to process payments for POS sales in Billing.

#### Context of use

- Start of the test after activating the ice cream shop and the first Manager.
- Subscription during or after the test.
- Monthly renewal by card or Automatic Pix.
- Update tax data or payment method.
- Recovery of declined card, insufficient balance, revoked authorization or
  chargeback.
- Consultation of charges, receipts and NFS-e.
- Cancellation, withdrawal from cancellation, refund or reactivation.
- Future operational retention and disposal after the retention period; no
  customer-facing deletion action is available in the current product.

#### Pains and needs

- Know the total cost before subscribing.
- Test all features without registering a card.
- Avoid immediate interruption due to a temporary charging failure.
- Regularize your subscription without losing registrations or histories.
- Obtain financial and tax documents in one place.
- Cancel without commercial contact or artificial obstacles.
- Know when access will be blocked and what future retention lifecycle applies.
- Preserve the authorship of changes made by different Managers.

#### Jobs to Be Done

- When I create my ice cream shop, I want to test all the features without informing
  a payment method, to evaluate Scoops without the risk of collection.
- When I see value during trial, I want to subscribe immediately, so
  turn the ice cream shop into a paying customer.
- When a charge fails, I want to know the reason and regularize the payment,
  to avoid interruption of operation.
- When my card or account changes, I want to change the payment method, to
  maintain automatic renewals.
- When I need to provide accounts, I want to consult receipts and NFS-e, to
  organize accounting.
- When I decide to leave, I want to cancel the renewal without losing the period already
  paid, to close the contract in a predictable manner.
- When I change my mind after a blockage, I want to pay and recover all
  data, to resume operation without re-registration.

---

### 3. Competitive Scenario Analysis

The Brazilian market combines four relevant models: free version
limited, temporary test, multiple plans per resources and contracting
assisted. Scoops' opportunity is not in replicating the breadth of ERPs
generalists, but in offering a simple subscription to a vertical product,
with a single price and no commercial limits that encourage shared accounts
or interrupt the operation.

#### Competitive matrix

| Solution | Public | Value proposition | Features | Public price | Limitations |
|---|---|---|---|---|---|
| [Consumer](https://www.consumer.com.br/) | Restaurants, bars, snack bars, coffee shops and ice cream shops | Operating restaurants on a platform with free entry | POS, orders, stock, tables, reports, tax, delivery and integrations | The official page informs free version up to 200 orders/month; the [official store](https://loja.consumer.com.br/) informs the Essential plan for R$ 59.90/month | Free access ends based on the volume of orders; modules and features vary between plans |
| [Kyte](https://www.kyte.com.br/planos) | Small merchants and sales teams | Simple management via cell phone and computer | POS, inventory, catalog, orders, reports, users and AI as per plan | The official page informs the free plan and paid plans of R$49.90, R$69.90 and R$99.90 per month | Number of users, available platform and features vary by level |
| [Saipos](https://saipos.com/sistema/sorveteria) | Ice cream shops and food establishments | Centralize operations, inventory, financial, tax and delivery | POS, scales, stock, technical data, reports, tax and integrations | The official page for ice cream shops informs plans starting at R$219.90/month and a seven-day free trial | Demo-driven subscription and offering broader than Scoops' initial scope |
| [Bling](https://www.bling.com.br/planos-e-precos) | Micro, small and medium multichannel companies | ERP integrated with sales, inventory, tax, finance and logistics | ERP, POS, invoices, integrations, financial, reports and limits by band | The [official communication from April 2026](https://ajuda.bling.com.br/hc/pt-br/articles/30224184866583-Altera%C3%A7%C3%A3o-nos-planos-e-pre%C3%A7os-do-Bling-em-abril-de-2025) informs monthly plans starting at R$55 and free initial trial | Plans and tiers vary by features, users, storage, and imported orders |
| Spreadsheet, reminder and manual billing | Small operations and software under validation | Low initial technical effort | Manual recording of due dates, payments and access | Variable | Does not offer reliable renewal, automatic reconciliation, auditing, or consistent blocking |

#### Rated Payment Providers

- The [Asaas Checkout](https://docs.asaas.com/docs/checkout-asaas) documentation
  informs hosted checkout, card, Pix, subscriptions, callbacks, webhooks and
  Sandbox. Asaas also documents a specific API for
  [AutoPix](https://docs.asaas.com/reference/criar-uma-autorizacao-pix-automatico).
- [AbacatePay](https://www.abacatepay.com/para/saas) reports subscriptions via
  card and Pix, public fees and webhooks. Your expanded subscription cycle in
  API v2 was published in the [changelog for April and May
  2026](https://docs.abacatepay.com/pages/changelog).
- Appmax publishes charge recurrence and recovery features, but does not
  unequivocal public documentation of Pix Automático was identified in the sources
  consulted.

#### Findings and inferences

- According to official sources, Consumer and Kyte reduce the entry barrier with
  free versions, but apply limits on volume, users or resources.
- According to the official Saipos page, its offer for ice cream parlors costs more and
  includes a larger operating surface.
- According to Bling's official documentation, volume and resources influence the
  plan framework.
- Inference based on sources: the price of R$59.90 places Scoops close
  to the entry of generalist solutions, but their justification depends on the
  specialization in production, stock and sale of ice cream and açaí.
- Source-based inference: A single, unlimited offering reduces data load
  comparison, protects individual authorship and differentiates Scoops from models with
  limits per user or operation.

#### Recommended differentials

- A single plan with explicit total price.
- Full test without card and without unexpected automatic conversion.
- No charges per user or operational volume.
- Card and Automatic Pix as equivalent recurring means.
- Seven days to recover payment failures before the lockdown.
- Automatic reactivation with full data preservation.
- Self-service cancellation without losing the period already paid.
- History of charges, receipts and NFS-e within the product.

---

### 4. Requirements

#### REQ-01 Commercial Plan and Offer

- [ ] **Commercial Plan and Offer**

**Description:** Scoops must sell a single monthly subscription, with
uniform price and scope for all ice cream shops.

##### Business Rules

- **Plan:** the only plan must be called `Complete Scoops`.
- **Price:** the monthly fee must be R$59.90, taxes included.
- **Frequency:** the charge must be monthly and there must be no contracting
  annual at MVP.
- **Scope:** the plan must release all Scoops modules and functionalities.
- **Commercial limits:** users, products, orders and movements must not
  have commercial limits.
- **Uniform price:** CPF and CNPJ must pay the same amount.
- **Fees:** there should be no additional fees for implementation, membership,
  cancellation, user, volume or payment method.
- **Adjustment:** a new price must be communicated at least 30 days after
  in advance and only applied to a renewal after that period.
- **Dependency:** functional permissions of each module continue to be
  determined by Identity profiles.

##### UI/UX rules

- **Interface:** display plan name, monthly price, included features and
  absence of additional fees in a single presentation, without level table.
- **Feedback:** any adjustment must show current value, new value and date of
  validity.
- **Empty state:** not applicable, as there is always a commercial offer.
- **Action blocked:** does not present annual selection, add-ons or customization of
  limits.
- **Responsiveness:** the offer must remain readable from 320 px.
- **Accessibility:** price, frequency and conditions must be exposed as
  text, not just by position or color.

---

#### REQ-02 Free Trial

- [ ] **Free Trial**

**Description:** A newly activated ice cream shop must fully experience the
Scoops for 14 days without providing a payment method.

##### Business Rules

- **Start:** the test must begin when the confirmation jointly activates the
  ice cream shop and its first Manager.
- **Duration:** the test must last 14 calendar days.
- **Access:** all modules, features and limits of the paid plan must
  be available.
- **No payment:** card and Pix should not be required to start the test.
- **Eligibility:** each ice cream shop and first Manager email must receive
  just a test.
- **Normalized email:** differences between upper and lower case letters should not be
  generate new eligibility.
- **Recreation:** deleting and recreating an account with the same email should not grant
  new test.
- **Subscription during trial:** payment confirmed during the test must close
  immediately the remaining days and start a monthly cycle.
- **Initial failure:** pending or rejected subscription attempt must not
  end the test while it is still valid.
- **Dependency:** the hash or identifier required to prevent retrial
  must be preserved without retaining the deleted account for operational use.

##### UI/UX rules

- **Interface:** indicate `In trial` status and end date on the
  Subscription.
- **Feedback:** show persistent banner only to Managers for the last seven
  days, with days remaining and `Subscribe Now` action.
- **Empty state:** not applicable during trial.
- **Action blocked:** Operators must not view the banner or the
  Subscription.
- **Responsiveness:** the banner must not cover navigation or operational actions.
- **Accessibility:** the deadline must have a textual date and not depend solely on
  countdown icon.

---

#### REQ-03 Holder, Billing Data and Acceptance

- [ ] **Owner, Billing Data and Acceptance**

**Description:** Subscription must identify the holder, collect data
necessary for billing and register explicit acceptance of the conditions.

##### Business Rules

- **Types of holder:** accept natural person with CPF and legal entity with
  CNPJ.
- **Mandatory data:** name or company name, CPF or CNPJ, email address
  billing, telephone number and full address.
- **Financial email:** may be different from Managers' emails and should not be
  create access to Scoops.
- **Validation:** CPF or CNPJ, email, telephone and address must follow the
  formats accepted by Asaas and tax issuance.
- **Synchronization:** Scoops must save a synchronized copy of the data
  required for display, reconciliation and NFS-e.
- **Change:** any Manager can update the data; changes must be valid
  only for future charges and invoices.
- **Tax history:** documents already issued must not be rewritten by a
  registration change.
- **Accept:** before checkout, the Manager must accept the Terms of Use and the
  Privacy Policy with price, recurrence, cancellation and retention.
- **Evidence:** record version of documents, user, date, time and IP address
  accept.

##### UI/UX rules

- **Interface:** group holder data and address in a section
  billing, visually distinguishing CPF from CNPJ.
- **Feedback:** validate fields before redirection and preserve data not
  sensitive when there is an error.
- **Empty state:** while there is no contract, inform that the data will be
  requested at checkout.
- **Action blocked:** prevent subscription without valid data and explicit acceptance.
- **Responsiveness:** forms must use an appropriate keyboard and not require
  horizontal scrolling.
- **Accessibility:** fields must have labels, instructions, association of
  errors and visible focus.

---

#### REQ-04 Checkout and Payment Methods

- [ ] **Checkout and Payment Methods**

**Description:** The Manager must purchase the plan through a checkout hosted by
Asaas using credit card or Automatic Pix.

##### Business Rules

- **Provider:** Asaas must be the sole provider of the MVP.
- **Checkout:** Scoops must create a hosted session and redirect the
  manager to complete the payment.
- **Card:** renewal must automatically charge the tokenized card for
  Asaas.
- **Pix:** the recurrence must use Automatic Pix with unique authorization from the
  payer; Monthly manual Pix does not meet the confirmed rule.
- **First charge:** contracting during the test must immediately charge R$
  59.90.
- **Activation:** only received and validated financial confirmation should activate
  the plan; the return URL is not proof of payment.
- **Security:** Scoops must not receive or store complete numbers,
  security code or banking credentials.
- **Reference:** checkout, customer, subscription and billing on Asaas must use
  references correlatable to the ice cream shop.
- **Dependency:** Automatic Pix must be approved in the Asaas account before
  launch.

##### UI/UX rules

- **Interface:** present final summary and action `Go to payment`; the Asaas
  collects sensitive data.
- **Feedback:** after return, show `Payment confirmed`, `Processing
  payment`, `Payment declined`, `Checkout cancelled` or `Checkout expired`.
- **Empty state:** without checkout initiated, display the available forms and the
  full price.
- **Action blocked:** prevent duplicate sessions while there is already an attempt
  valid in processing.
- **Responsiveness:** the checkout return must preserve the context on mobile
  and computer.
- **Accessibility:** return messages must be focused and announced
  by assistive technology.

---

#### REQ-05 Signature and Access Control States

- [ ] **Subscription and Access Control States**

**Description:** The system must maintain an auditable local state of the signature and
Enforce consistent access across all protected routes and actions.

##### Business Rules

| Status | Meaning | Operational access |
|---|---|---|
| `In trial` | 14-day trial current | Full |
| `Pending initial payment` | Checkout completed without final confirmation | Full if the test is still valid; blocked otherwise |
| `Active` | Paid period confirmed | Full |
| `In tolerance` | Renewal failed or chargeback occurred no more than seven days ago | Full |
| `Scheduled cancellation` | Renewal cancelled, paid period still valid | Full until the end date |
| `Blocked` | Trial ended, tolerance expired, canceled period ended, or refund was issued | Subscription Only and My Account |
| `Scheduled disposal` | Block achieved 90-day retention and an operational disposal job is scheduled | Subscription only and My account until operational completion |
| `Disposed` | Operational data removed by the future operational lifecycle | None |

- **Source of financial truth:** events and queries authenticated to Asaas
  determine payments; Scoops determines access from the state
  reconciled.
- **Authorization:** every protected route and operation must validate the state, without
  depend only on the interface.
- **Scope blocked:** a blocked ice cream shop can only access Subscription,
  My Account and Sign Out. The current product exposes no customer-facing
  deletion danger zone.
- **Preservation:** blocking should not change or delete operational data.
- **Application time:** the new state must affect access within 60 seconds
  upon receipt of a valid webhook.
- **Sessions:** changing to blocked should remove operational access including
  of sessions already open.
- **Reactivation:** payment confirmed during the 90 days must restore
  automatically full access without changing data.

##### UI/UX rules

- **Interface:** the Subscription screen must display status, period, next action
  and relevant dates.
- **Feedback:** during the 60 seconds, show `Processing payment` and
  allow updating the query without duplicating charges.
- **Empty state:** if there is no subscription after trial, present the offer and
  subscription action.
- **Action blocked:** when trying to open operational module, explain the reason and
  direct Managers to Subscription; Operators receive guidance to
  look for a Manager.
- **Responsiveness:** the lock must keep egress and recovery accessible in
  small screens.
- **Accessibility:** state, cause and solution must be textual and not depend
  just in color.

---

#### REQ-06 Renewal, Billing Failure and Tolerance

- [ ] **Renewal, Billing Failure and Tolerance**

**Description:** Subscription must renew monthly and offer seven days to
correct faults before blocking the operation.

##### Business Rules

- **Renewal:** the starting date of the first confirmed payment must define the
  monthly cycle according to Asaas calendar rules.
- **Success:** a paid renewal should extend the active period and generate new
  charge history.
- **Failure:** card declined, insufficient balance, invalid Pix authorization or
  Unpaid charges must begin `In Tolerance`.
- **Deadline:** tolerance must last seven calendar days from the date of failure.
- **Access:** all modules remain available during the tolerance.
- **Retries:** the system must use the retries supported by Asaas and
  allow safe manual action for payment recovery.
- **Discharge:** confirmed payment ends the tolerance and restores `Active`.
- **Expiration:** without payment, the status must change to `Blocked` at the end of the
  deadline.
- **Idempotence:** repeated events cannot extend period, duplicate
  charge or switch states incorrectly.

##### UI/UX rules

- **Interface:** display alert with presentable reason, remaining time and actions
  `Pay now` and `Change payment method`.
- **Feedback:** confirm each attempt without asserting success before the webhook.
- **Empty state:** not applicable to tolerance.
- **Action blocked:** if the provider is unavailable, keep last state and
  inform that the payment recovery is temporarily unavailable.
- **Responsiveness:** alerts must prioritize deadline and action on small screens.
- **Accessibility:** the alert must be announced and focus on the action
  main without blocking operational navigation.

---

#### REQ-07 Change in Payment Method

- [ ] **Change of Payment Method**

**Description:** Any Manager must switch between card and Automatic Pix without
expose sensitive financial data.

##### Business Rules

- **Authorization:** only Managers can initiate the change.
- **Modes:** allow card to card, card to Pix Automatic, Pix
  for card and new Pix authorization.
- **Regular subscription:** the new payment method must be valid for the next renewal.
- **Default:** during tolerance or blocking, the new payment method must
  try to pay off the outstanding monthly payment.
- **Confirmation:** do not replace the active mode before confirming the
  Asaas.
- **Revocation:** canceling a Pix authorization at the bank must be reflected in the
  next sync.
- **Card displayed:** store and display flag only, last four digits
  and validity when provided by the provider.
- **Failure:** a rejected change must preserve the previous payment method when
  it is still valid.

##### UI/UX rules

- **Interface:** show current masked payment method and action `Change payment
  method`, with secure redirection to Asaas.
- **Feedback:** differentiate pending, completed, refused, canceled authorization
  and expired.
- **Empty status:** without active payment method, guide subscription or payment recovery.
- **Action blocked:** prevent parallel changes while there is an attempt
  pending.
- **Responsiveness:** cards and actions must stack without truncating information
  essential.
- **Accessibility:** the masked payment method must have an accessible and
  Never rely solely on the flag icon.

---

#### REQ-08 Cancellation and Resumption of Renewal

- [ ] **Cancellation and Resumption of Renewal**

**Description:** Any Manager must cancel the next renewal without losing the
period already paid and undo the cancellation before the end date.

##### Business Rules

- **Authorization:** any Manager can cancel; Operators do not see the
  action.
- **Effect:** cancellation must prevent future charges and maintain access until
  the end of the current cycle.
- **Proportional refund:** should not exist in common cancellation.
- **Confirmation:** require a single confirmation with consequences and end date.
- **Reason:** can be optionally collected and should never prevent the action.
- **Resumption:** `Keep subscription` before the end date must remove the
  scheduled cancellation without immediate charge.
- **Expiration:** at the end of the canceled cycle, change to `Blocked` and start
  90 day retention.
- **Exclusion of the ice cream shop:** a customer-facing manual deletion action
  is not available in the current product. Any future operational deletion
  lifecycle must cancel the subscription before removing operational data.
- **Asaas failure:** does not show cancellation as completed until confirmed
  from the provider.

##### UI/UX rules

- **Interface:** keep subscription cancellation distinct from any future
  operational retention or deletion lifecycle; the current product has no
  customer-facing deletion danger zone.
- **Feedback:** after canceling, show end date and `Keep subscription` action.
- **Empty state:** do not show cancellation when there is no active subscription.
- **Action blocked:** Provider failure must maintain previous state and offer
  new attempt.
- **Responsiveness:** confirmation and consequences must remain legible in
  320px.
- **Accessibility:** focus must remain within the confirmation and return to
  original action when canceling the dialogue.

---

#### REQ-09 Refund and Chargeback

- [ ] **Refund and Chargeback**

**Description:** Billing must allow cancellation of the first monthly payment and
handle subsequent disputes without ambiguous financial status.

##### Business Rules

- **Eligibility:** only the first monthly payment can receive a refund
  in full for withdrawal within seven days after payment.
- **Channel:** any Manager must be able to request a refund through the payment screen
  Subscription.
- **Processing:** refund must use the means and rules supported by the
  Asaas.
- **Access:** confirmation of refund must immediately block modules
  operational and initiate 90-day retention.
- **New test:** resubscribing after reimbursement should not grant a new test.
- **Renewals:** do not have a proportional refund, except for undue charges or
  legal obligation.
- **Undue charging:** must follow the applicable legal and operational treatment,
  without being limited by the first monthly payment rule.
- **Chargeback:** a confirmed dispute must initiate seven days of grace
  for new payment.
- **Regularization:** payment on time maintains or restores `Active`.
- **Failure:** without payment recovery, the chargeback should result in `Blocked`.
- **Tax:** refund must trigger cancellation or adjustment of NFS-e according to
  applicable tax rule.

##### UI/UX rules

- **Interface:** during eligibility, display `Cancel and request
  refund`, with value, deadline and immediate effect on access.
- **Feedback:** differentiate request sent, refund processing,
  confirmed and rejected.
- **Empty state:** after seven days, remove the repentance action and keep the
  common cancellation.
- **Action blocked:** prevent duplicate orders while there is a refund in
  processing.
- **Responsiveness:** consequences must appear before final confirmation.
- **Accessibility:** the severity of the blockage should not be communicated only by
  color.

---

#### REQ-10 Billing, Receipts and History

- [ ] **Charges, Vouchers and History**

**Description:** Managers must consult the ice cream shop's financial history without
access to the provider panel.

##### Business Rules

- **Fields:** each charge must preserve billing period, due date, payment,
  value, payment method, status, internal identifier and Asaas identifier.
- **Status:** support at least pending, paid, failed, past due, refunded and
  contested.
- **Proof:** provide receipt or proof provided by Asaas
  when existing.
- **NFS-e:** link the corresponding invoice to the charge paid.
- **Immutability:** completed records should not be overwritten by states
  futures; changes must produce auditable events or transitions.
- **Order:** display charges from most recent to oldest.
- **Access:** any Manager can consult; Operators cannot access.
- **Masking:** never show full card or bank details.

##### UI/UX rules

- **Interface:** use table on desktop and lines or compact cards on cell phone,
  with expandable detail.
- **Feedback:** indicate loading, query failure and recent update.
- **Empty state:** before the first charge, explain that the history will be
  displayed after subscribing.
- **Action blocked:** unavailable receipt or invoice must show the reason and
  state, not a broken link.
- **Responsiveness:** preserve value, date and status as information
  priorities.
- **Accessibility:** headers, lines and actions must maintain table semantics or
  accessible list and names.

---

#### REQ-11 Issuance and Delivery of NFS-e

- [ ] **Issuance and Delivery of NFS-e**

**Description:** Each monthly fee paid must generate an NFS-e with tax data
in force in the jurisdiction.

##### Business Rules

- **Trigger:** issue only after payment confirmation.
- **Owner:** use the billing data in force at the time of billing.
- **Delivery:** send to billing email and make available in history.
- **Failure:** a fiscal unavailability should not block or suspend a
  paid subscription.
- **Pending status:** log failure, automatically retry and alert
  administrative operation of Scoops.
- **Idempotence:** a charge cannot generate duplicate invoices due to repetition of
  event.
- **Correction:** new registration data is only valid for future invoices;
  Retroactive corrections follow an exceptional process and fiscal rule.
- **Refund:** cancel or adjust the invoice as permitted by the authority
  municipal.
- **Dependency:** municipality, certificate, service code, rate and regime
  Scoops tax must be configured and approved outside the Scoops interface.
  customer.

##### UI/UX rules

- **Interface:** display number, billing period, status and action `Download NFS-e`.
- **Feedback:** use states `Issuing`, `Emitted`, `Temporary failure`,
  `Cancelled` or equivalent.
- **Empty state:** unpaid charge should not suggest that a invoice already exists.
- **Action blocked:** if failed, replace download with explanation and inform
  that access remains active.
- **Responsiveness:** number and action can stack, without losing association with the
  billing.
- **Accessibility:** invoice links must include competency or number in the name
  accessible.

---

#### REQ-12 Billing Notifications

- [ ] **Billing Notifications**

**Description:** Scoops must notify Managers and financial contact about
events that require knowledge or action.

##### Business Rules

- **Channels:** use email and notice within the product; SMS and WhatsApp do not belong
  to MVP.
- **Managers:** end of test, billing failure, blocking, cancellation,
  reactivation, readjustment and deletion must be sent to all active Managers.
- **Financial email:** receipts, NFS-e and billing communications must be
  sent to the billing address.
- **End of test:** notify 7, 3 and 1 day in advance.
- **Default:** notify immediately and on days 3 and 6 of tolerance.
- **Blocking:** notify when it occurs.
- **Automatic exclusion:** notify 30, 7 and 1 day in advance.
- **Adjustment:** notify at least 30 days before it comes into effect.
- **Duplicate messages:** the same occurrence and milestone should not generate messages
  repeated by duplicate webhooks.
- **Audit:** record sending attempt and result.

##### UI/UX rules

- **Interface:** warnings within the product must show cause, deadline and action
  recommended.
- **Feedback:** email links must open the correct context after authentication.
- **Empty state:** absence of alerts does not require a notification center in the
  MVP.
- **Action blocked:** invalid recipient must generate operational alert without
  expose data to other clients.
- **Responsiveness:** banners must allow reading and closing without covering
  essential content.
- **Accessibility:** critical alerts must use icon, text and semantics
  appropriate, not just color.

---

#### REQ-13 Retention, Reactivation and Future Operational Disposal

- [ ] **Retention, Reactivation and Future Operational Disposal**

**Description:** Operational data for a locked ice cream shop must remain
recoverable for 90 days and be securely disposed of by an authorized future
operational lifecycle at the end of the period. This is not a customer-facing
Identity action.

##### Business Rules

- **Start:** test expired, tolerance expired, end of period canceled or
  Confirmed refunds must initiate 90-day retention.
- **Preservation:** users, products, inventory, orders, configurations and
  History must not be changed during retention.
- **Reactivation:** confirmed payment must cancel the scheduled operational
  disposal and restore full access.
- **Exclusion:** after 90 days, cancel any remaining recurrence in the
  Asaas before removing operational data.
- **Provider failure:** if the cancellation is not confirmed, maintain the
  blocked ice cream shop, preserve the data, alert the operation and repeat the action.
- **No free access:** Asaas failure cannot reactivate operational modules.
- **Backups:** Disposed data can only persist in encrypted backups
  for up to 30 days.
- **Restore:** restoring a backup must reapply previously recorded operational
  disposals to return the environment to operation.
- **Customer action:** Identity does not expose a customer-facing deletion
  action. Any future operational disposal remains conditional on successful
  subscription cancellation and the applicable retention policy.
- **Export:** there must be no operational export during the blockade in
  MVP.

##### UI/UX rules

- **Interface:** when this future lifecycle is implemented, display the
  scheduled operational-disposal date and reactivation action during the 90
  days; this Spec does not add that UI.
- **Feedback:** payment must remove the count only after confirmation.
- **Empty state:** not applicable while data is retained.
- **Action blocked:** if the provider prevents operational disposal, do not
  offer operational access and do not state that data has been removed.
- **Responsiveness:** deadline, consequences and contracting must be visible in
  cell phone.
- **Accessibility:** count must include the exact date and not depend solely on
  a visual indicator.

---

#### REQ-14 Tax Filing and Privacy

- [ ] **Tax File and Privacy**

**Description:** Any future operational disposal of the ice cream shop must
remove eligible operational data while separately preserving the tax minimum
required by legal obligation.

##### Business Rules

- **Term:** maintain minimum tax records for five years after issuance or
  according to the higher legal period that may be applicable.
- **Content:** NFS-e and its identifiers, holder and CPF/CNPJ, value,
  billing period, dates, billing and transaction identifiers, payment method and
  cancellation, refund or chargeback records.
- **Exclusions:** products, inventory, orders, team users, passwords, sessions
  and operational audits do not belong in the fiscal archive.
- **Segregation:** the file must remain separate from the operational bank and not
  can reactivate the ice cream shop.
- **Purpose:** use only for tax, accounting, legal and
  defense of rights; commercial or marketing use is prohibited.
- **Access:** limit to authorized Scoops accounting or legal operation and
  register queries.
- **Disposal:** delete safely at the end of the applicable period, unless new
  legal obligation or documented dispute.
- **Dependency:** the Identity product does not expose manual deletion, and any
  future operational-disposal contract must preserve this fiscal exception.

##### UI/UX rules

- **Interface:** before any future operational disposal, inform that minimum tax
  records will be preserved for the legal period and remain unavailable in the
  product.
- **Feedback:** the conclusion must distinguish operational data deleted from
  retained tax records.
- **Empty state:** not applicable.
- **Action blocked:** no excluded user can access the tax file via
  Scoops.
- **Responsiveness:** the legal explanation must remain legible on screens
  small.
- **Accessibility:** any future legal-retention notice must use direct language
  and be announced before an operational disposal state change.

---

#### REQ-15 Permissions and Audit

- [ ] **Permissions and Auditing**

**Description:** Billing must respect Identity's fixed profiles and preserve the
authorship of administrative actions.

##### Business Rules

- **Managers:** any Manager can view, hire, change data and
  payment, cancel, resume, refund and reactivate.
- **Operators:** cannot view the `Subscription` navigation, prices,
  charges, documents or actions.
- **Audit:** register subscription, acceptance, registration change, change of
  payment, cancellation, resumption, reactivation and refund request.
- **Details:** preserve action, responsible, moment, previous state, new
  status and relevant technical identifiers.
- **Automatic events:** also record renewal, failure, blocking, deletion
  scheduled and reconciliation as system actions.
- **Sensitive data:** logs and audits cannot contain complete card, code
  security, credentials or banking details.
- **Isolation:** all query and mutation must be limited to the ice cream shop in the
  authenticated user.

##### UI/UX rules

- **Interface:** relevant events must appear in the administrative audit
  existing with actor `System` or Manager name.
- **Feedback:** Manager's actions must confirm results and inform when
  still waiting for the provider.
- **Empty state:** show the subscription or test start event as
  first registration.
- **Action blocked:** Operators should not see links or financial status.
- **Responsiveness:** the timeline must prioritize action, person responsible and date.
- **Accessibility:** events must have understandable textual descriptions,
  not just status codes.

---

#### REQ-16 Integration, Reliability and Security

- [ ] **Integration, Reliability and Security**

**Description:** Integration with Asaas must tolerate repeated events, delays
and unavailability without double charges or undue blocking.

##### Business Rules

- **Webhooks:** validate authenticity, origin and structure before processing.
- **Idempotence:** use event and operation identifiers to prevent
  duplicate effects.
- **Processing:** respond quickly to the provider and execute changes
  internally in an asynchronous and observable way.
- **Reconciliation:** periodically consult pending subscriptions and charges
  to recover lost or deviating events.
- **Unavailability:** preserve the last confirmed state; an ice cream shop
  active cannot be blocked just because Asaas is unavailable.
- **Pending operations:** checkout, change, cancellation or refund without
  confirmation must remain pending, never assumed to be completed.
- **Alerts:** persistent failures, discrepancies, pending tax issuance and
  prevented deletion should alert Scoops operation.
- **Secrets:** Asaas credentials must remain outside the client, with
  rotation and minimal access.
- **Environments:** use separate accounts and keys for Sandbox and production.
- **Data:** encrypt billing data in transit and at rest.
- **Backoffice:** do not build an internal financial panel; use the dashboard
  Asaas and correlated technical logs.

##### UI/UX rules

- **Interface:** pending states must inform that confirmation may take
  a few moments and allow a new consultation.
- **Feedback:** technical errors must have a secure message, identifier
  possible support and action.
- **Empty state:** unavailability should not delete information already
  synchronized.
- **Action blocked:** prevent repeating operation while a request
  idempotent is in progress.
- **Responsiveness:** contingency states must work in all
  supported devices.
- **Accessibility:** asynchronous updates must be announced without moving the
  focus unexpectedly.

---

#### REQ-17 Navigation, Responsiveness and Accessibility

- [ ] **Navigation, Responsiveness and Accessibility**

**Description:** The Subscription screen must include offer, status, payment,
billing, history and cancellation in one coherent experience.

##### Business Rules

- **Navigation:** `Signature` must remain in the administrative footer of the
  sidebar and be available only to Managers.
- **Sections:** present summary of the plan, current status, next charge, form
  payment details, billing data, history and cancellation as per the
  state.
- **Contextual actions:** only display actions valid for the current state.
- **Block:** Subscription and My Account must remain accessible when
  other modules are blocked.
- **Accessibility:** comply with WCAG 2.2 level AA.
- **Responsiveness:** all flows must work from 320 px.
- **Internationalization:** currency and dates must use Brazilian format; rules
  financial calendar follow the provider.

##### UI/UX rules

- **Interface:** follow the Scoops design system, with protagonist numbers,
  neutral surfaces, purple in primary actions and semantic colors for states.
- **Feedback:** offer loading status, success, error, processing,
  void and blocking in each async section.
- **Empty state:** guide the next action without showing tables or cards
  empty without explanation.
- **Blocked action:** explain reason, consequence and correction; don't use buttons
  disabled without supporting text.
- **Responsiveness:** tables must adapt to lists or cards; actions
  Primaries remain visible without horizontal scrolling.
- **Accessibility:** guarantee keyboard, visible focus, labels, announced errors,
  AA contrast and states that do not depend solely on color.

---

#### REQ-18 Metrics and Instrumentation

- [ ] **Metrics and Instrumentation**

**Description:** Billing must instrument the trial and subscription funnel to
evaluate conversion, default and retention.

##### Business Rules

- **Main metric:** rate of ice cream shops that start the test and become
  payers up to 30 days after its end.
- **Initial target:** minimum conversion of 20%, treated as a hypothesis until it exists
  sufficient historical basis.
- **Minimum events:** test started, warning displayed, checkout started,
  abandoned checkout, payment confirmed, payment failed, subscription
  canceled, undone cancellation, blocking, reactivation, refund and deletion.
- **Secondary metrics:** MRR, conversion during trial, time to subscribe,
  renewal failure, recovery on tolerance, voluntary churn, churn
  involuntary and use of card versus Pix.
- **Privacy:** analytical events must not contain full CPF/CNPJ, email,
  card or bank details.
- **Consistency:** financial metrics must reconcile with charges
  confirmed, not just interface events.

##### UI/UX rules

- **Interface:** there is no need for a metrics dashboard within Billing in
  MVP.
- **Feedback:** instrumentation should not block or delay user actions.
- **Empty state:** not applicable to the client interface.
- **Action blocked:** analytical failure should not prevent subscription or
  payment.
- **Responsiveness:** not applicable to background collection.
- **Accessibility:** instrumentation cannot interfere with focusing, reading or
  assistive navigation.

---

### 5. User Flow

#### Flow A - Start Free Trial

1. The first Manager confirms the account created during onboarding.
2. The system activates the ice cream shop and starts 14 days of full trial.
3. Billing records the eligibility used for the ice cream shop and email.
4. The Manager accesses all modules without providing a payment method.
5. In the last seven days, the system displays the deadline banner.
6. The flow ends with current trial, subscription, or expiration.

#### Flow B - Subscribe during trial

1. The Manager selects `Subscribe Now`.
2. The system presents `Full Scoops`, R$ 59.90/month and the conditions.
3. The Manager provides billing data and accepts current documents.
4. The system creates the Asaas checkout and redirects the Manager.
5. The Manager chooses a card or authorizes Automatic Pix.
6. Asaas processes the first payment:
   - Success: the webhook confirms the payment, ends the test and starts the cycle
     monthly on the date of confirmation.
   - Pending: Scoops keeps the test valid and shows `Processing payment`.
   - Failure or cancellation: the test remains until its original date.
7. The system issues NFS-e and records the charge.

#### Flow C - Subscribe after trial expiration

1. The Manager enters Scoops blocked.
2. The system only allows Subscription, My Account and Logout; no deletion action
   is shown to the customer.
3. The Manager selects the plan and completes the checkout.
4. While payment is pending, the block remains.
5. After confirmation, the system reactivates all modules within 60 seconds.
6. All previous data remains intact.

#### Flow D - Renew successfully

1. Asaas carries out the monthly billing on the scheduled date.
2. Card or Automatic Pix confirms payment.
3. The webhook reports the charge to Scoops.
4. The system processes the event once, extends the active period and records
   the history.
5. The system issues NFS-e and sends the documents to the financial email.

#### Flow E - Recover renewal failure

1. Renewal fails.
2. The system changes the signature to `In Tolerance` for seven days.
3. All Managers receive immediate notice; new warnings occur on the 3rd and
   6.
4. The Manager pays again or changes the payment method:
   - Success: the subscription returns to `Active`.
   - Pending: full access remains until the end of the tolerance period.
   - Failed: the original deadline continues, without being restarted.
5. Without payment after seven days, operational modules are blocked.

#### Flow F - Change payment method

1. The Manager opens Subscription and selects `Change payment method`.
2. Scoops starts Asaas secure flow.
3. The Manager registers another card or authorizes Pix Automatic.
4. Asaas confirms the change:
   - Regular subscription: the new payment method is valid on the next renewal.
   - Defaulting: the system attempts to settle the pending charge.
   - Failure: the previous valid mode is preserved.
5. Billing records the change in the audit.

#### Flow G - Cancel and undo cancellation

1. The Manager selects `Cancel subscription`.
2. The system shows the final access date, 90-day retention and difference to
   exclusion from the ice cream shop.
3. Manager can enter a reason and confirm once.
4. After confirmation from Asaas, the status changes to `Scheduled cancellation`.
5. Until the end date, the Manager can select `Keep subscription`:
   - Success: the original renewal is restored without immediate billing.
   - No resumption: the period ends, the ice cream shop is blocked and starts
     retention.

#### Flow H - Request refund of the first monthly payment

1. During the seven days following the first payment, the Manager selects
   `Cancel and request refund`.
2. The system shows the full value and immediate blocking after confirmation.
3. The Manager confirms.
4. Asaas processes the refund:
   - Success: access is blocked, 90-day retention begins and NFS-e is
     canceled or adjusted.
   - Pending: the status and action are being processed.
   - Failed: Previous access and subscription are preserved.
5. A future hire does not grant a new test.

#### Flow I - Handle chargeback

1. Asaas informs you that a paid charge has been disputed and reversed.
2. The system initiates a seven-day grace period and notifies all Managers.
3. The Manager informs a new payment method or pays again.
4. The system validates:
   - Success: returns to `Active`.
   - Failure or lack of action: blocked at the end of the deadline.
5. The history preserves original payment, dispute and payment recovery.

#### Flow J - Consult history and NFS-e

1. The Manager opens Subscription.
2. The system displays the most recent charges.
3. The Manager opens a record and consults billing period, value, payment method and
   status.
4. If the receipt and NFS-e are available, you can download them.
5. If the invoice is pending, the system explains the failure without blocking access.

#### Flow K - Reactivate on hold

1. The Manager enters an ice cream shop that has been locked for less than 90 days.
2. The system shows the preserved data, the future operational-disposal date and
   the offer.
3. The Manager completes a new payment.
4. After confirmation, the system cancels the scheduled operational disposal and reactivates all
   modules in up to 60 seconds.
5. Users, products, inventory, orders and settings reappear unchanged.

#### Flow L - Operationally dispose after 90 days

1. The system notifies Managers 30, 7 and 1 day before the operational-disposal date.
2. After completing 90 days, try to cancel any remaining recurrence in the
   Asaas.
3. Asaas responds:
   - Success: the authorized operational lifecycle removes eligible operational and access data.
   - Failure: keeps the ice cream shop blocked, preserves data, alerts the operation and
     try again.
4. Minimum tax records are moved or maintained in the segregated file by
   five years.
5. Operational backups age and expire within 30 days.

#### Flow M - Asaas unavailability

1. A query or financial operation fails due to external unavailability.
2. Scoops preserves the last committed state of the subscription.
3. An active ice cream shop remains active; a blocked one remains blocked.
4. The requested action remains pending or fails safely without assuming
   success.
5. The system reconciles the state when the provider comes back and applies the transition to
   up to 60 seconds after confirmation.

---

### 6. Out of Scope

- Payments made by ice cream shop customers at the POS.
- Cash, change, bleeding, supply and sales reconciliation.
- Tax issuance of orders or sales from the ice cream shop.
- Permanent free plan.
- More than one paid plan.
- Annual, semi-annual or loyalty subscription.
- Charge per user, product, order, movement or storage.
- Coupons, promotional discounts, referrals, credits and personalized prices.
- Add-ons and modules sold separately.
- Subscription pause.
- Monthly bill, debit, cash or manual Pix.
- Payment in installments.
- Export of operational data during lockdown.
- Own financial backoffice at Scoops.
- Billing recovery via WhatsApp, SMS or call.
- Multiple ice cream shops in a single subscription.
- Corporate contracts, consolidated billing and commercial negotiation.
- Proportional refund for renewals or partially used periods.
- Restoration of ice cream parlor after operational deletion completed.

#### Discarded during definition

- **Freemium:** discarded; there will only be temporary trial and paid subscription.
- **Price of R$49.90:** replaced by R$59.90 due to positioning
  vertical and the impact of subscription revenue.
- **Multiple plans:** dropped to reduce comparison, permissions and
  migrations in MVP.
- **Annual plan:** postponed until retention and price data is available.
- **Require payment method in test:** discarded to reduce the barrier to
  entry and prevent unexpected charges.
- **Preserve remaining days when subscription:** discarded; confirmed payment
  ends the test and immediately starts the monthly cycle.
- **Card only:** replaced by card and Automatic Pix.
- **Monthly manual Pix:** replaced by Automatic Pix to maintain renewal
  appellant.
- **AvocadoPay:** maintained as a future alternative; Asaas was chosen by
  maturity, Sandbox and documented coverage of the required flow.
- **Appmax:** discarded in MVP because documentation was not identified
  unequivocal public statement of Pix Automatic in the sources consulted.
- **Immediate cancellation:** replaced by cancellation at the end of the period already
  paid.
- **Signature pause:** discarded; cancellation and resubscribing cover the
  initial need.
- **Immediate blocking due to default:** replaced by tolerance of seven
  days.
- **Immediate blocking due to chargeback:** replaced by a period of seven days to
  payment recovery.
- **Reactivate access when cancellation in Asaas fails:** discarded; to
  ice cream shop remains locked and data is preserved.
- **Keep the complete bank for five years:** discarded; just the file
  minimum tax remains a legal obligation.
- **Backups for 35 days:** replaced by maximum retention of 30 days.
- **Delete absolutely all records:** replaced by preservation
  segregated from the fiscal and financial minimum required by law.
