---
description: Ownership and responsibility boundaries for the Scoops business modules.
---

# Business Modules

Scoops is divided into cohesive business modules. Each module owns its domain
rules, use cases, persistence adapters, application endpoints, and user
experience. Shared infrastructure supports those modules without absorbing their
business responsibilities.

Modules exchange identifiers, explicit contracts, and business events. A module
must not import another module's internal entities, repositories, database models,
or implementation details.

## Identity

Identity owns the platform's establishments, users, profiles, statuses,
authentication, access, and identity-related auditing.

The model uses `User` as the entity that grants access to an establishment. In
the MVP, a user belongs to one establishment, and the user identifier is the same
identifier provided by the authentication provider.

Product requirements are documented in
[`prds/identity.md`](prds/identity.md).

## Billing

Billing owns the commercial relationship between an establishment and Scoops:
the offer, trial period, subscription, recurring charges, tax documents,
delinquency, cancellation, reactivation, and commercial product availability.

Billing maintains the subscription lifecycle and determines the establishment's
commercial access level. Payment-provider and tax-document-provider integrations
belong to this boundary, but those providers do not define its business rules.

Payments made by an establishment's customers, cash, change, sales
reconciliation, and order tax documents belong to PDV or another operational
module. Billing must not assume those responsibilities.

Product requirements are documented in
[`prds/billing.md`](prds/billing.md).

## MRP

MRP owns products, categories, brands, inventory, recipes, production, and
accompaniments. It is authoritative for stock and production behavior consumed by
the sales operation.

Product requirements are documented in [`prds/mrp.md`](prds/mrp.md).

## PDV

PDV, the point-of-sale module, owns sales, sales channels, carts, orders, combos,
inventory consumption, and sales-operation history.

It consumes product and availability boundaries exposed by MRP without taking
ownership of MRP's catalog, recipe, production, or stock rules.

Product requirements are documented in [`prds/pdv.md`](prds/pdv.md).

## Communication

Communication owns notifications and communications originating from other
modules while keeping message composition and delivery separate from the
business events that trigger them.

Other modules publish facts from their own domain. Communication reacts to those
events and coordinates channels such as transactional email and in-product
notifications. It must not reproduce the originating module's business rules.

Product requirements are documented in
[`prds/communication.md`](prds/communication.md).

## Boundary rules

- Put a business capability in the module that is authoritative for its rules and
  lifecycle.
- Keep domain declarations in the corresponding module under `packages/core`.
- Keep server controllers, persistence, messaging jobs, and adapters under the
  same owning module in `apps/server`.
- Keep feature UI under the same owning module in `apps/web/src/ui`.
- Use shared directories only for capabilities intentionally reused by multiple
  modules and containing no module-specific business policy.
- Communicate across modules through identifiers, core contracts, and business
  events rather than internal imports.
- Update this document and the owning PRD when module responsibility changes.
