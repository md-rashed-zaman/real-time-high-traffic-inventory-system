# Requirements

## Project Goal

Build a backend and frontend for a limited edition sneaker drop where stock is highly contested. Users must see stock updates in real time and must be able to reserve one item for a short checkout window.

## Functional Requirements

- Users can view active merch drops.
- Users can reserve one unit of a drop.
- Reservation temporarily decreases available stock by one.
- Reservation lasts for 60 seconds.
- Expired reservations automatically return stock.
- Users can complete purchase only for an active reservation.
- Purchases permanently consume the reserved unit.
- Admin UI is not required.
- API must support creating a new merch drop.
- Drop list response must include the latest 3 successful purchasers for each drop.
- Connected clients must receive live stock updates.

## Non-Functional Requirements

- Prevent overselling under high concurrency.
- Keep database state authoritative.
- Keep UI simple but usable.
- Show loading states and error feedback.
- Do not commit secrets.
- Include setup and architecture explanation in README.

## Assumptions

- Full authentication is out of scope. A lightweight username-based user model is enough for the assessment.
- Payment processing is out of scope. Completing purchase simulates a successful payment.
- A drop can start in the future using `startsAt`.
- Inventory is tracked as `totalStock` and `availableStock`.

## Out Of Scope

- Admin dashboard UI.
- Real payment provider integration.
- Multi-region deployment.
- Complex anti-bot protection.
