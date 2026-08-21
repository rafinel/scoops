### 1. Overview

The **Identity — Identity and Access** module allows you to create an ice cream shop in
Scoops, activate your first Manager, authenticate the team and manage the cycle
users' lives. The module also defines which areas each profile can
access, preserves authorship of administrative changes and maintains each
user linked to a single ice cream shop.

The MVP access model is deliberately simple. There are only profiles
fixed `Manager` and `Operator`. Managers have full access to Scoops and
manage the team. Operators only access `New Sale` and `Orders`.

**Purpose:** to allow an ice cream shop to start using Scoops through a
direct onboarding and keep team access updated without configuration
complex of permissions.

**Problem resolved:** team entries, role changes and terminations
require quick granting or revocation of access. Without centralized rules, a
person can access undue functions, actions no longer have reliable authorship and
old accounts remain available.

**Value delivered:** simple onboarding, predictable access, isolation by
ice cream shop, individual responsibility and full control of the life cycle
of the organization's data.

---

### 2. Target audience

#### Main audience

Managers of independent ice cream and açaí shops who need to register their
organization, invite staff, and control who has administrative or
operational.

#### Secondary audiences

- Operators who need to enter Scoops and only access sales flows
  authorized.
- New managers who start using Scoops and become the first
  Ice cream shop manager.

#### Not public

- Users who need to belong to more than one ice cream shop with the same account.
- Networks that require multi-store hierarchy or centralized administration.
- Organizations that need custom profiles or individual permissions.
- Scoops internal team seeking to assume the identity of a customer or
  Globally access ice cream shops.

#### Context of use

- First access for an ice cream shop to Scoops.
- Entry of new Managers or Operators into the team.
- Promotion, demotion, inactivation or reactivation of users.
- Use on computers, tablets or cell phones, including devices
  shared.
- Consultation of administrative changes and identification of those responsible.

#### Pains and needs

- Start using the product without extensive configuration.
- Grant access without sharing passwords.
- Ensure that Operators do not reach administrative functions.
- Immediately remove access from those who left the team.
- Know who changed a user and when.
- Prevent the ice cream shop from being left without an active Manager.
- Completely exclude the ice cream shop when the customer decides to close his shop
  use of Scoops.

#### Jobs to Be Done

- When I start using Scoops, I want to create my ice cream shop and confirm
  my account, to take over the administration safely.
- When a person joins the team, I want to invite them with the correct profile,
  so that she can create her own password and access only what is necessary.
- When a person changes role, I want to promote or demote them, so that the
  access tracks your current responsibility.
- When a person leaves the team, I want to immediately revoke their access,
  to protect the operation without erasing the history.
- When an administrative change raises doubts, I want to consult whoever
  carried out and when, to reconstruct what happened.
- When I decide to permanently stop using Scoops, I want to delete the
  ice cream shop and all associated data, so as not to maintain a residual operation.

---

### 3. Competitive Scenario Analysis

Management solutions for food and point of sale usually offer users
and permissions as part of broader operating platforms. According to your
official sources, there are approaches that range from directly configured permissions
per user to reusable functions and personal codes for identification in the
box.

Scoops will not seek to replicate this granularity in the MVP. The opportunity is
in offering an easier to understand model for small teams: two
fixed profiles, no individual exceptions and explicit rules for promotion,
inactivation and preservation of authorship.

#### Competitive matrix

| Solution | Public | Value proposition | Features | Public price | Limitations |
|---|---|---|---|---|---|
| [Saipos](https://saipos.com/sistema/sorveteria) | Ice cream shops and food establishments | Centralize service, stock, management and delivery | Individual users, types and permissions, in addition to operational modules | The official page informs plans starting at R$ 219.90/month | According to [user documentation](https://meajuda.saipos.com/hc/pt-br/articles/27043903853460-Como-criar-um-novo-usu%C3%A1rio-no-sistema-Saipos), the same user cannot be used simultaneously on two devices |
| [Toast](https://support.toasttab.com/en/article/Access-Permissions-Reference) | Restaurants, groups and multi-unit operations | Control team responsibilities at the point of sale and in administration | Permissions by role, multiple roles per employee and rules by location | Not publicly identified in the sources consulted | Greater range of configuration than needed for the initial Scoops audience |
| [Square](https://my.squareup.com/help/us/en/article/8357-require-passcodes-at-point-of-sale) | Small and medium-sized businesses with point of sale | Identify team members and limit actions at the register | Permission Sets, Personal Codes, Shared Code, and Owner Code | [Square Advanced Access](https://squareup.com/us/en/staff/advanced-access) is reported to be included with Square Plus $49/month per location and Premium $149/month per location plans | Shared codes do not allow you to attribute sales and activities to a specific person |
| Spreadsheet, shared password and verbal control | Small operations without formal access management | Low initial effort | Manual People Listing and Informal Credential Sharing | Variable | Does not reliably revoke access, reduces authorship and increases administrative errors |

#### Findings and inferences

- According to Saipos' official documentation, permissions can be enabled or
  disabled per user and management requires managerial access.
- The official Toast page states which permissions are normally assigned
  by functions and may vary between locations.
- Square documentation differentiates between personal, shared, and third-party code.
  owner; only the personal code preserves individual attribution.
- Source-based inference: mature solutions serve larger operations with
  Flexible models but require more configuration decisions.
- Source-based inference: Scoops can differentiate itself for small
  teams reducing configuration without giving up authorship and revocation.

#### Recommended differentials

- Onboarding of the ice cream shop and the first Manager in a single flow.
- Only two profiles, with responsibilities that are easy to explain.
- No individual permissions capable of creating unexpected combinations.
- Invitations that preserve the secret of the new user's password.
- Rules that prevent self-elevation and the absence of an active Manager.
- Administrative audit understandable by the Manager himself.
- Full exclusion of the ice cream shop under the customer's command.

---

### 4. Requirements

#### REQ-01 Ice Cream Shop Onboarding

- [ ] **Ice Cream Shop Onboarding**

**Description:** A new customer must be able to create an ice cream shop and their account
First Manager via a public stream.

##### Business Rules

- **Mandatory data:** the flow must request the name of the ice cream shop, name of the
  Manager, email and password.
- **Ice cream shop:** the name must be mandatory, but may be repeated in
  different ice cream shops.
- **First profile:** the first user must receive the `Manager` profile.
- **Pending access:** the Manager cannot access the system before confirming the
  account.
- **Joint activation:** confirmation must activate the ice cream shop and the first
  Manager.
- **Post-confirmation session:** after the confirmation link activates the onboarding,
  the current verified session must become authenticated local access and open the main
  Scoops page without requiring the Manager to enter their credentials again.
- **Correction of pending email:** before activation, the person responsible must be able to
  return to the initial step to correct only the first Manager's email;
  the name of the ice cream shop and the name of the Manager must remain filled in.
- **Correction confirmation:** to save the new email, the person responsible must
  Enter the registered password again.
- **Correction validation:** the new email must be valid and available;
  in case of failure, the previous address and pending onboarding must be
  preserved.
- **New submission:** after saving a new email, the previous confirmation link
  must lose its validity and a new confirmation must be sent to the address
  corrected.
- **Correction cancellation:** when canceling the edit, the person responsible must return
  pending confirmation without changing the registration.
- **Deadline:** an unconfirmed onboarding must expire after seven days.
- **Deadline after correction:** correcting the email or resending the confirmation should not
  restart the original seven-day onboarding period.
- **Expiration:** upon expiration, the pending ice cream shop and the corresponding bill
  must be removed, freeing the email for another attempt.
- **Separate registration:** there must be no public user creation without a new
  ice cream parlor or valid invitation.
- **Dependency:** commercial subscription can accompany onboarding, but
  its rules belong to the Subscription module.

##### UI/UX rules

- **Interface:** present short form, with clear progress and language
  aimed at the person responsible for the ice cream shop.
- **Feedback:** after sending, inform that the account depends on confirmation and
  indicate the address used.
- **Confirmation completion:** after a valid confirmation, redirect the Manager directly
  to the authenticated main page; do not require a second login.
- **Correction:** in the pending confirmation step, present the action `Back and
  fix`; when activating it, return to the initial step in editing mode, keep the
  filled data and focus on the email field.
- **Return after correction:** after saving, return to pending confirmation,
  display the updated address and inform you that a new message has been sent.
- **Empty state:** not applicable to the initial form.
- **Action blocked:** prevent access to modules while confirmation is in progress
  pending.
- **Responsiveness:** the flow must work fully from 320 px.
- **Accessibility:** fields must have labels, instructions, visible focus and
  errors announced by assistive technology.

---

#### REQ-02 Authentication and Session

- [ ] **Authentication and Session**

**Description:** Active users must log into Scoops with their email and password and
remain authenticated only during a valid session.

##### Business Rules

- **Method:** the MVP must only accept email and password.
- **Active account:** only active users of active ice cream shops can enter.
- **Neutral message:** failures should not reveal whether an email is registered.
- **Attempts:** after five consecutive failures, new attempts must be made.
  blocked for 15 minutes.
- **Inactivity:** the session must expire after 30 minutes without interaction.
- **Maximum duration:** a session must require re-authentication after seven days,
  even if it remains in use.
- **Concurrency:** the same user can maintain sessions on multiple devices.
- **Exit:** `Exit this device` should only end the current session.
- **Session loss:** when possible, uncompleted work should be
  preserved for resumption after new login.

##### UI/UX rules

- **Interface:** present Scoops brand, email, password, main action
  entry and access to recovery.
- **Feedback:** differentiate loading, credential failure, blocking
  temporary and session expired.
- **Empty state:** not applicable.
- **Action blocked:** pending, inactive or accounts belonging to ice cream shops
  unavailable must receive guidance without exposing internal data.
- **Responsiveness:** the form must remain readable and operable in
  cell phone, tablet and computer.
- **Accessibility:** must allow keyboard filling, screen readers
  and password managers.

---

#### REQ-03 Password and Access Recovery

- [ ] **Password and Access Recovery**

**Description:** The user must create or reset their own password without a
Manager can know it or define it in its place.

##### Business Rules

- **Length:** the password must be between 8 and 64 characters.
- **Responsibility:** Managers can never view or set passwords for
  other users.
- **Recovery:** every password change must happen through the recovery flow
  sent to the registered email.
- **Single use:** the recovery link must be usable once.
- **Validity:** the link must expire after one hour.
- **Revocation:** reset must terminate all user sessions.
- **Non-existent account:** the request must present the same response for
  registered and unregistered emails.
- **Individual limit:** an address can receive a maximum of three messages
  24-hour authentication.
- **Interval:** resubmissions must respect a minimum interval of two minutes.

##### UI/UX rules

- **Interface:** only request the email upon recovery and the new password after
  link validation.
- **Feedback:** confirm the request without revealing the existence of the account.
- **Empty state:** not applicable.
- **Action blocked:** expired or used links must guide a new one
  request.
- **Responsiveness:** the flow must work without horizontal scrolling on screens
  small.
- **Accessibility:** password requirements and errors must be textual and not
  depend only on color.

---

#### REQ-04 Profiles and Authorization

- [ ] **Profiles and Authorization**

**Description:** The system must apply fixed permissions per profile to all
protected navigation entries and actions.

##### Business Rules

- **Profiles:** there must only be `Manager` and `Operator`.
- **Immutability:** profiles cannot be created, renamed, edited,
  duplicated or deleted.
- **No exceptions:** there must be no individual granting or removal of
  permissions.
- **Manager:** has full access to all modules and configurations.
- **Operator:** can only access `New Sale` and `Orders`.
- **Direct access:** addresses or shortcuts cannot bypass permissions.
- **Isolation:** every user and every action must remain restricted to their own
  ice cream shop.
- **Own profile:** no user can promote or demote themselves.
- **Last Manager:** no action can leave the ice cream shop without at least one
  Active manager.

##### UI/UX rules

- **Interface:** display the profile as a fixed user attribute, without control controls
  granular permissions.
- **Feedback:** promotion and relegation must present confirmation and result.
- **Empty state:** not applicable.
- **Action blocked:** hide actions incompatible with the profile and explain
  relevant administrative blocks.
- **Responsiveness:** authorized menus must remain accessible on screens
  minors without covering the content.
- **Accessibility:** the active state and restrictions should not depend solely on
  of color.

---

#### REQ-05 User Registration and Invitation

- [ ] **User Registration and Invitation**

**Description:** A Manager must be able to invite a new user to their own
ice cream shop with name, email and profile.

##### Business Rules

- **Authorization:** only Managers can register users.
- **Fields:** name, email and profile are mandatory.
- **Single email:** each email can belong to only one account in the entire
  Scoops, ignoring case differences.
- **Initial state:** the user must remain `Pending` until accepting the invitation
  and set the password.
- **Validity:** the invitation must expire after seven days.
- **Resend:** a new invitation must invalidate the previous link and restart the
  deadline.
- **Pending correction:** before activation, the Manager can correct the data of the
  invitation.
- **Cancellation:** pending invitations can be canceled and removed
  definitely.
- **Activation:** the activated user must assume the profile chosen in the invitation.
- **Guest manager:** a Manager can directly register another Manager.

##### UI/UX rules

- **Interface:** present form with name, email and selection between the two
  profiles, accompanied by a short explanation of each profile.
- **Feedback:** inform shipping, resending, activation, expiration and cancellation.
- **Empty state:** when there is only the first Manager, invite the
  add the team.
- **Action blocked:** duplicate email or temporary sending limit must be
  informed along with the corresponding action.
- **Responsiveness:** form and confirmations must fit on small screens.
- **Accessibility:** profile selection and messages must be operable and
  understandable by keyboard and screen reader.

---

#### REQ-06 User Listing and Query

- [ ] **User List and Consultation**

**Description:** Managers must quickly locate users and understand their
profile, status and recent activity.

##### Business Rules

- **Authorization:** only Managers can consult team management.
- **Visible data:** the listing must present name, email, profile, status and
  last access.
- **Search:** must locate by name or email.
- **Filters:** must filter by profile and status.
- **States:** the listing must distinguish between `Pending`, `Active` and `Inactive`.
- **Detail:** each user must have a view with data, available actions
  and administrative history.
- **Current account:** the authenticated user must not appear in this management list or
  be available through its detail route; personal data is managed through My Account.
- **Isolation:** no results can include users from another ice cream shop.
- **Global summary:** the total team count and Manager/Operator counts must represent all
  manageable users in the current ice cream shop, excluding the authenticated Manager, and
  must not change when search, profile/status filters or pagination alter the table.

##### UI/UX rules

- **Interface:** use a responsive table or list with contextual actions.
- **Feedback:** search, filters and loading must indicate the current state.
- **Empty state:** distinguish absence of search team or filter without
  results.
- **Action blocked:** unavailable actions must be hidden or show the
  reason for blocking.
- **Responsiveness:** on narrow screens, prioritize name, profile and status and
  move details to the dedicated view.
- **Accessibility:** filters, lines and action menus must be navigable by
  keyboard.

---

#### REQ-07 Promotion and Demotion

- [ ] **Promotion and Demotion**

**Description:** A Manager must be able to promote an Operator to Manager or
demoting another Manager to Operator.

##### Business Rules

- **Authorization:** only Managers can change another user's profile.
- **Self-change:** the user cannot change their own profile.
- **Promotion:** must immediately grant the full profile set
  `Manager`.
- **Demotion:** must immediately remove administrative and
  preserve `New Sale` and `Orders`.
- **Last Manager:** relegation must be blocked when leaving
  ice cream shop without an active Manager.
- **History:** the change must not modify the authorship of previous actions.
- **Notification:** the affected user must be notified about the change.

##### UI/UX rules

- **Interface:** display the action in user detail with access description
  acquired or lost.
- **Feedback:** require confirmation and report success or failure.
- **Empty state:** not applicable.
- **Action blocked:** explain the prohibition of self-change and the protection of
  last Manager.
- **Responsiveness:** confirmation must preserve reading and actions on screens
  small.
- **Accessibility:** focus must return to the trigger element after closing the
  confirmation.

---

#### REQ-08 Inactivation and Reactivation

- [ ] **Inactivation and Reactivation**

**Description:** Managers must revoke and restore user access without
erase your identity or history.

##### Business Rules

- **Inactivation:** must immediately terminate all user sessions and
  prevent new entries.
- **Self-inactivation:** no user can inactivate their own account.
- **Last Manager:** it should not be possible to inactivate the last active Manager.
- **History:** active users must be inactivated, never deleted
  individually.
- **Reserved email:** an inactive user's email cannot be reused.
- **Reactivation:** must restore access to the same account with the current profile.
- **Password:** reactivation does not authorize the Manager to set a password.
- **Notification:** the user must be notified about inactivation and reactivation.

##### UI/UX rules

- **Interface:** display status and corresponding action in user detail.
- **Feedback:** inactivation should warn that open sessions will be closed.
- **Empty state:** not applicable.
- **Action blocked:** explain prohibited self-inactivation and protection of the latter
  Manager.
- **Responsiveness:** actions must remain available without depending on hover.
- **Accessibility:** status must have explicit text in addition to color.

---

#### REQ-09 Personal Data and My Account

- [ ] **Personal Data and My Account**

**Description:** Every user must check their identity, change their
name and close the current session.

##### Business Rules

- **First name:** any user can change their own name.
- **Correction by Manager:** Managers can correct the name of other users.
- **Active email:** email cannot be changed after activation.
- **Snapshot:** name changes should not modify names preserved in
  historical records.
- **Profile:** the profile must be read-only in `My Account`.
- **Exit:** there must only be the `Exit this device` action.
- **Password:** there must be no direct password change within the session; the user
  uses email recovery.

##### UI/UX rules

- **Interface:** display editable name, email and read-only profile and action
  exit.
- **Feedback:** name changes must inform saving, error and status
  loading.
- **Empty state:** not applicable.
- **Action blocked:** immutable fields must explain why they cannot be
  changed.
- **Responsiveness:** the page must work entirely on cell phones.
- **Accessibility:** read-only fields must be distinguishable without losing
  readability.

---

#### REQ-10 Administrative Audit

- [ ] **Administrative Audit**

**Description:** The module must maintain an immutable history of changes to
identity and access carried out at the ice cream shop.

##### Business Rules

- **Actions audited:** register, resend invitation, cancel invitation, activate,
  promote, demote, inactivate, reactivate, initiate recovery and change names.
- **Content:** each record must identify action, affected user, responsible
  and date and time.
- **Changes:** when applicable, preserve previous value and new value.
- **Secrets:** passwords, activation links and recovery content should never be
  appear in the audit.
- **Immutability:** records cannot be edited or removed
  individually.
- **Retention:** the audit remains for the entire life of the ice cream shop.
- **Access:** only Managers can consult the audit.
- **Time Zone:** dates must be displayed in São Paulo time.

##### UI/UX rules

- **Interface:** display timeline in user detail with action,
  responsible and moment.
- **Feedback:** loading and query failure must be reported.
- **Empty state:** explain when there is still no change beyond creation.
- **Action blocked:** Operators must not view entries or shortcuts to the
  audit.
- **Responsiveness:** events must reorganize their fields without truncating the action.
- **Accessibility:** the chronological order and relationships must be
  understandable outside of the visual presentation.

---

#### REQ-11 Ice Cream Shop Management

- [ ] **Ice Cream Shop Management**

**Description:** Managers must consult and change the name of their own ice cream shop.

##### Business Rules

- **Unique data:** the MVP institutional registration contains only the name of the company
  ice cream shop.
- **Change:** any Manager can change the name.
- **Historical identity:** the change must not move users or data to
  another ice cream shop.
- **Audit:** the change must preserve the previous name, new name, person responsible
  and moment.
- **Duplicate names:** another ice cream shop may use the same name.
- **Access:** Operators cannot consult or change this configuration.

##### UI/UX rules

- **Interface:** display the current name and a clear editing action.
- **Feedback:** inform success, error and loading of the change.
- **Empty status:** not applicable, as the name is mandatory from onboarding.
- **Action blocked:** Operators must not see `Ice Cream Parlor` in the navigation.
- **Responsiveness:** editing and feedback must work on cell phones.
- **Accessibility:** the editing state must maintain label, instruction and focus
  visible.

---

#### REQ-12 Manual Exclusion of Ice Cream Parlor — Removed from Product

- [x] **Manual Exclusion of Ice Cream Parlor — Removed from Product**

**Description:** The Scoops product does not expose a customer-initiated action
to delete an ice cream shop. Identity settings must not provide a deletion
danger zone, deletion dialog, password confirmation, name confirmation or
customer-facing deletion endpoint.

##### Business Rules

- **Availability:** neither Managers nor Operators can initiate establishment
  deletion from the product.
- **Data lifecycle:** any future operational deletion or retention lifecycle is
  owned by the applicable Billing and operational policies, outside this
  Identity feature.
- **History and legal retention:** removing the customer-facing action does not
  authorize rewriting historical records or bypassing applicable fiscal
  retention requirements.

##### UI/UX rules

- **Interface:** do not display a deletion danger zone or deletion action in
  establishment settings or navigation.
- **Feedback:** no deletion confirmation or deletion-progress state is part of
  the Identity product surface.
- **Action blocked:** direct attempts to call an unexposed deletion operation
  must not be accepted as a supported Identity workflow.

---

#### REQ-13 Navigation, States and Quality of Experience

- [ ] **Navigation, States and Quality of Experience**

**Description:** Identity must offer coherent navigation, clear states and
an accessible experience across all streams.

##### Business Rules

- **Users:** available only to Managers.
- **Ice Cream Parlor:** available only to Managers.
- **My account:** available for Managers and Operators in the user menu.
- **State coverage:** there must be states for pending confirmation,
  pending invitation, expired link, link already used, inactive account, access
  denied, communication failure and session expired.
- **Consistency:** hidden menus do not replace the validation of protected actions.
- **Authorship:** relevant actions must always remain associated with the user
  who carried them out.

##### UI/UX rules

- **Interface:** follow the Scoops design system, with Manrope, surfaces
  neutral colors, purple as the brand color and Lucide icons.
- **Feedback:** every action that awaits a response must present loading,
  success and error.
- **Empty state:** each list without content must explain the situation and offer
  the next valid action.
- **Action blocked:** messages should explain why and, where possible, how
  resolve.
- **Responsiveness:** all flows must work from 320 px without
  Mandatory horizontal scrolling.
- **Accessibility:** meet WCAG 2.2 level AA, with contrast, visible focus,
  keyboard navigation, labels, announced messages and appropriate touch targets.

---

#### REQ-14 MVP Success Criteria

- [ ] **MVP Success Criteria**

**Description:** Product performance must be monitored by indicators of
activation, administrative autonomy and functional security.

##### Business Rules

- **Onboarding:** at least 90% of completed onboardings must confirm the account
  within 24 hours.
- **Invitations:** at least 90% of accepted invitations must be completed without
  supportive intervention.
- **Efficiency:** user registration or change must be able to be completed in
  less than two minutes by a Manager familiar with the flow.
- **Audit:** 100% of the planned administrative actions must produce the
  corresponding record.
- **Authorization:** no validation scenario can allow access between
  ice cream shops or action incompatible with the profile.
- **Monitoring:** indicators must be evaluated after launch to
  guide corrections and prioritization.

##### UI/UX rules

- **Interface:** events required for measurement should not add steps to the
  user flow.
- **Feedback:** failures that prevent completion must be distinguishable from abandonment
  voluntary.
- **Empty state:** reports without sufficient volume must indicate no
  conclusive sample.
- **Action blocked:** not applicable to everyday use of the module.
- **Responsiveness:** any future visualization of the indicators must follow the
  responsive product pattern.
- **Accessibility:** indicators should not depend solely on color.

---

### 5. User Flow

#### Flow A - Create ice cream shop and first Manager

1. The person responsible initiates public onboarding.
2. The system requests the name of the ice cream shop, the name of the Manager, email and password.
3. The person responsible sends the registration.
4. The system keeps the ice cream shop and bill pending and requests confirmation.
5. In the pending confirmation, the person responsible can select `Go back and correct`:
   - The system returns to the initial stage in editing mode, preserving the name of the
     ice cream shop and the name of the Manager and focuses on the email.
   - The person responsible changes the email, enters the password again and saves it.
   - Success: the system invalidates the previous link, sends a new confirmation,
     returns to the pending stage and maintains the original seven-day deadline.
   - Invalid or unavailable email: preserves the previous address and displays
     the reason for the necessary correction.
   - Cancellation: returns to pending confirmation without changing the registration.
6. The person responsible confirms the account:
   - Success: ice cream shop and first Manager become active.
   - Invalid link, already used or expired: the system instructs you to resend the
     confirmation, new registration or entry, if the account is already active.
7. The Manager enters Scoops and starts configuring the operation.

#### Flow B - Enter Scoops

1. The user enters email and password.
2. The system validates the account, ice cream shop and previous attempts.
3. The system decides:
   - Success: opens the first authorized area for the profile.
   - Invalid credentials: presents a neutral message and preserves the email.
   - Temporary blocking: informs you when it will be possible to try again.
   - Pending or inactive account: guides the user without revealing internal data.
4. After inactivity or maximum duration, the system requests a new login.

#### Flow C - Regain access

1. User selects `I forgot my password`.
2. Enter the email.
3. The system presents the same confirmation regardless of the existence of the
   account.
4. The user opens a valid link and sets the new password.
5. The system validates:
   - Success: change the password and close previous sessions.
   - Expired or used link: guides new request.
6. The user logs in again.

#### Flow D - Invite user

1. A Manager goes to `Users` and selects `Invite user`.
2. Provide your name, email and profile.
3. The system validates uniqueness and mandatory fields.
4. The Manager confirms the shipment.
5. The registration appears as `Pending`.
6. The guest accepts the invitation and sets the password:
   - Success: the user becomes `Active` with the chosen profile.
   - Expired link: the Manager can resend a new invitation.

#### Flow E - Cancel pending invitation

1. The Manager opens a `Pending` user.
2. Select `Cancel invitation`.
3. The system informs you that the link will no longer be valid and the registration will be removed.
4. The Manager confirms:
   - Success: the invitation is invalidated and the email released.
   - Failed: registration remains pending.

#### Flow F - Promote Operator

1. The Manager opens an active Operator.
2. Select `Promote to Manager`.
3. The system lists the access that will be granted.
4. The Manager confirms.
5. User receives full access, audit log and notification.

#### Flow G - Demote Manager

1. The Manager opens another active Manager.
2. Select `Demote to Operator`.
3. The system validates:
   - There is another Manager active: allows to continue.
   - The action would leave the ice cream shop without a Manager: block and explain the rule.
4. The Manager confirms.
5. The user now only accesses `New Sale` and `Orders` and is notified.

#### Flow H - Inactivate user

1. The Manager opens another active user.
2. Select `Inactivate`.
3. The system validates self-inactivation and protection of the last Manager.
4. The system informs you that existing accesses will be closed.
5. The Manager confirms:
   - Success: the user becomes `Inactive`, loses access and is notified.
   - Failed: no state is changed.

#### Flow I - Reactivate user

1. The Manager filters inactive users.
2. Open the desired account and select `Reactivate`.
3. The system preserves and displays the current profile.
4. The Manager confirms.
5. The user becomes active and receives a notification.

#### Flow J - Consult audit

1. The Manager opens a user's detail.
2. The system displays the administrative timeline.
3. The Manager identifies action, person responsible, timing and applicable changes.
4. If there are no additional events, the system explains that there is only the
   initial registration.

#### Flow K - Change the name of the ice cream shop

1. The Manager accesses `Ice Cream Parlor`.
2. Change the name and confirm.
3. The system validates that the value is not empty.
4. The system saves the change and records the audit.
5. The new name will appear in future areas without changing history.

#### Flow L - Change your own name and exit

1. User opens `My Account`.
2. Change the name:
   - Success: the new name will be displayed in future uses.
   - Failure: the previous value is preserved.
3. When desired, select `Leave this device`.
4. Only the current session is closed and the user returns to login.

---

### 6. Out of Scope

- Multiple ice cream shops linked to the same account.
- Hierarchy of groups, branches or franchises.
- Profiles beyond `Manager` and `Operator`.
- Customized profiles and individual permissions.
- Personal or shared codes for quick access at the POS.
- Two-factor authentication.
- Social, corporate or passwordless login.
- Change of email after activation.
- Direct password change within `My Account`.
- Manual action to terminate all sessions.
- Individual deletion of users with history.
- Information about the ice cream shop in addition to the name.
- Super administrator, impersonation or global access to ice cream shops.
- Customer-initiated deletion of the ice cream shop from the product.
- The operational deletion and retention lifecycle, including any future
  automatic deletion policy.
- Data export before deletion.
- Operational settings for stock, sales, printing or menu within the
  Identity.

#### Discarded during definition

- **Custom profiles:** dropped in favor of just `Manager` and
  `Operator`, reducing configuration and unexpected combinations.
- **Individual permissions:** replaced by fixed sets per profile.
- **PIN at POS:** discarded; Access uses email and password.
- **Multiple ice cream shops per user:** discarded to maintain a single link in the
  MVP.
- **Additional institutional data:** corporate name, documents, contacts and
  address were considered and removed; the ice cream shop only has a name.
- **Authenticated password change:** replaced exclusively by recovery
  by email.
- **Single session:** discarded; multiple devices can remain active.
- **End all sessions manually:** discarded; the interface offers
  only output from current device.
- **Customer-initiated deletion:** removed from the product; Identity settings
  do not expose a deletion action or confirmation flow.
- **Super Administrator:** discarded to prevent global access to ice cream shops.
