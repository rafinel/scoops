# PRD — Communication Module

## Overview

The Communication module centralizes the sending of important Scoops messages.

It is responsible for sending emails and displaying notifications within the product when relevant events occur in other modules, such as Identity, Billing and Inventory.

The objective is to ensure that each user receives clear information, at the appropriate time and through the correct channel.

## Target audience

- Ice cream parlor managers.
- Users invited or affected by access changes.
- Financial managers.
- Users who need to follow operational alerts from the ice cream shop.

## Competitive Landscape

Solutions for restaurants and retail already use inventory alerts and centralized communications to reduce stockouts and support operational decisions. This behavior appears in products such as [Consumer](https://consumer.com.br/reduzir-desperdicio-restaurante) and [Saipos](https://saipos.com/sistema/sorveteria).

Scoops' difference will be to bring together communications from different modules into a unique experience, with specific messages for each recipient and permanent history within the product.

## Requirements

### REQ-01 — Communication channels

The module must allow:

- Sending emails.
- Display of notifications within the product.
- Use of one or both channels for each type of message.
- Different recipients depending on the context of the message.

SMS, WhatsApp and push notifications are not part of the MVP.

### REQ-02 — Stock Messages

The module must display internal notifications for:

- Stock below ideal: inform the product, the quantity available and the ideal quantity.
- Zero stock: inform the product that has no quantity available.

### REQ-03 — Billing Messages

The module must send or display messages related to:

- End of the trial period, with notices 7, 3 and 1 day before.
- Payment in processing.
- Billing failure.
- Tolerance period for default.
- Blockade of the ice cream shop.
- Cancellation of subscription.
- Reactivation of the subscription.
- Price adjustment, with a minimum notice of 30 days.
- Automatic exclusion, with notices 30, 7 and 1 day in advance.
- Billing receipts.
- NFS-e.
- Billing communications to the financial person responsible.
- Chargeback for Managers.
- Relevant fiscal and operational failures.

Messages should state the situation, the applicable deadline, and what the recipient needs to do when action is required.

### REQ-04 — Identity Messages

The module must send emails to:

- Confirmation of onboarding.
- Confirmation after changing the email.
- User invitation.
- Resending invitation.
- Password recovery.
- User promotion or demotion.
- User inactivation or reactivation.
- Exclusion of the ice cream shop for Managers.

### REQ-05 — Message content

Each message must have content appropriate to the channel and recipient.

Internal notifications must present:

- Objective title.
- Message with the necessary context.
- Date and time of receipt.

E-mails must have a subject, HTML content and, when necessary, attached documents.

Messages must be written in Brazilian Portuguese in MVP.

### REQ-06 — Notification Center

The product must have a notification center accessible through the Header.

The center must:

- Only display notifications from the authenticated user.
- Organize notifications by date.
- Allow filtering by period.
- Upload old notifications via the “See more” button.
- Keep history without retention limit.
- Display empty status when there are no notifications.

There should be no separate filter for read and unread notifications.

### REQ-07 — Reading notifications

A notification should be considered read when it is visible to the user.

Reading must be individual. Marking a notification as read for one user cannot change its status for another user.

### REQ-08 — Consistency of communications

Each relevant event must generate mandatory communication according to its definition.

If communication cannot be initiated, the action that originated the message must not be completed.

Once initiated, the communication must be processed without requiring the user to remain on the screen.

### REQ-09 — History and clarity

Messages displayed on the product must remain available for consultation.

The content must be clear, direct and sufficient for the user to understand:

- What happened.
- When it happened.
- Who was affected.
- What needs to be done, when applicable.

##UserFlow

1. A relevant event occurs in a Scoops module.
2. The system identifies appropriate recipients and channels.
3. Communication starts.
4. The recipient receives an email, an internal notification, or both.
5. The internal notification appears in the Header dropdown.
6. The user can open the center to check the history.
7. When visible, the notification is marked as read for that user.
8. User can filter history by date and load old notifications.

## Out of Scope

- SMS, WhatsApp and push.
- Read and unread filter.
- History retention limit.
- Customization of messages by the user.
- Choice of channels by the user.
- Administrative panel to monitor shipping status.
- Display of attempts or technical failures to the user.
- Support for multiple languages ​​in MVP.
- Plain text emails in MVP.
