# API Contract

Base URL: `http://localhost:4000/api`

## GET /health

Returns service status.

## POST /users

Creates or returns a user by username.

Request:

```json
{ "username": "alex" }
```

## POST /drops

Creates a new merch drop.

Request:

```json
{
  "name": "Air Jordan 1",
  "totalStock": 100,
  "startsAt": "2026-06-15T18:00:00.000Z"
}
```

## GET /drops

Returns drops with latest 3 purchasers.

Response:

```json
[
  {
    "id": "...",
    "name": "Air Jordan 1",
    "totalStock": 100,
    "availableStock": 42,
    "startsAt": "...",
    "latestPurchasers": [
      { "username": "alex", "purchasedAt": "..." }
    ]
  }
]
```

## POST /drops/:dropId/reserve

Request:

```json
{ "userId": "..." }
```

Success response:

```json
{
  "reservationId": "...",
  "expiresAt": "...",
  "availableStock": 41
}
```

Conflict response when sold out or duplicate active reservation:

```json
{ "error": "DROP_SOLD_OUT", "message": "No stock is available for this drop." }
```

## POST /reservations/:reservationId/purchase

Request:

```json
{ "userId": "..." }
```

Success response:

```json
{ "purchaseId": "..." }
```
