# API Reference — STS-Backend

> **Base URL:** `http://localhost:3000/api/v1`  
> All request and response bodies use `Content-Type: application/json`.

---

## Table of Contents

- [Authentication](#authentication)
- [Error Format](#error-format)
- [Auth Endpoints](#auth-endpoints)
  - [Sign Up](#post-authsign-up)
  - [Sign In](#post-authsign-in)
  - [Sign Out](#post-authsign-out)
- [User Endpoints](#user-endpoints)
  - [Get All Users](#get-users)
  - [Get User by ID](#get-usersid)
- [Subscription Endpoints](#subscription-endpoints)
  - [Create Subscription](#post-subscriptions)
  - [Get User Subscriptions](#get-subscriptionsuserid)
  - [Update Subscription](#put-subscriptionsid)
  - [Cancel Subscription](#put-subscriptionsidcancel)
- [Workflow Endpoints](#workflow-endpoints)
  - [Subscription Reminder Webhook](#post-workflowssubscriptionreminder)
- [Data Models](#data-models)
- [Frontend Integration Guide](#frontend-integration-guide)

---

## Authentication

Protected routes require a **JWT Bearer token** in the `Authorization` header.

```
Authorization: Bearer <token>
```

Tokens are returned from the sign-up and sign-in endpoints. Store them (e.g., in `localStorage` or a secure cookie) and attach them to every protected request.

**Token payload:** `{ userId: string }`  
**Expiry:** Configured by `JWT_EXPIRES_IN` env var (e.g., `"7d"`).

---

## Error Format

All errors share a consistent shape:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

| HTTP Status | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Unauthorized — missing or invalid token, or wrong password |
| 404 | Resource not found |
| 409 | Conflict — e.g., email already registered |
| 500 | Internal server error |

---

## Auth Endpoints

### POST /auth/sign-up

Register a new user. Returns a JWT token alongside the created user.

**Request body**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | required, 2–50 chars |
| `email` | string | required, valid email format, unique |
| `password` | string | required, min 6 chars |

**Response — 201 Created**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "663f1a2b4e1234567890abcd",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2024-05-11T10:00:00.000Z",
      "updatedAt": "2024-05-11T10:00:00.000Z"
    }
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 409 | `"User already exist"` |
| 400 | Mongoose validation message (e.g., missing fields, invalid email) |

---

### POST /auth/sign-in

Authenticate an existing user and receive a JWT token.

**Request body**

```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Response — 200 OK**

```json
{
  "success": true,
  "message": "User signed in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "663f1a2b4e1234567890abcd",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2024-05-11T10:00:00.000Z",
      "updatedAt": "2024-05-11T10:00:00.000Z"
    }
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 404 | `"User not found"` |
| 401 | `"Invalid password"` |

---

### POST /auth/sign-out

Placeholder endpoint. Currently returns a stub response. Implement token invalidation on the client side (remove the stored token).

---

## User Endpoints

### GET /users

Returns all registered users. No authentication required.

> ⚠️ This endpoint exposes all user records. Consider restricting it in production.

**Response — 200 OK**

```json
{
  "success": true,
  "data": [
    {
      "_id": "663f1a2b4e1234567890abcd",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2024-05-11T10:00:00.000Z",
      "updatedAt": "2024-05-11T10:00:00.000Z"
    }
  ]
}
```

---

### GET /users/:id

Get a single user by their MongoDB ObjectId. Requires authentication.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | string | MongoDB ObjectId of the user |

**Headers**

```
Authorization: Bearer <token>
```

**Response — 200 OK**

```json
{
  "success": true,
  "data": {
    "_id": "663f1a2b4e1234567890abcd",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "2024-05-11T10:00:00.000Z",
    "updatedAt": "2024-05-11T10:00:00.000Z"
  }
}
```

> The `password` field is excluded from the response.

**Errors**

| Status | Message |
|---|---|
| 401 | `"Unauthorized"` — missing/invalid token |
| 404 | `"User not found"` |

---

## Subscription Endpoints

### POST /subscriptions

Create a new subscription for the authenticated user. Automatically triggers reminder emails via Upstash Workflow.

**Headers**

```
Authorization: Bearer <token>
```

**Request body**

```json
{
  "name": "Netflix",
  "price": 15.99,
  "currency": "USD",
  "frequency": "monthly",
  "category": "entertainment",
  "paymentMethod": "credit card",
  "startDate": "2024-01-01T00:00:00.000Z",
  "renewalDate": "2024-02-01T00:00:00.000Z",
  "status": "active"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | ✅ | 2–50 chars |
| `price` | number | ✅ | >= 0 |
| `currency` | string | — | `"USD"` (default) \| `"INR"` \| `"EUR"` |
| `frequency` | string | ✅ | `"daily"` \| `"weekly"` \| `"monthly"` \| `"yearly"` |
| `category` | string | ✅ | See [category values](#category-values) |
| `paymentMethod` | string | ✅ | Any text (e.g., `"credit card"`, `"PayPal"`) |
| `startDate` | ISO date | ✅ | Must be a past or current date (`<= now`) |
| `renewalDate` | ISO date | — | Auto-calculated from `startDate + frequency` if omitted |
| `status` | string | — | `"active"` (default) \| `"cancelled"` \| `"expired"` |

**Category values**

`sports`, `news`, `entertainment`, `lifestyle`, `technology`, `finance`, `poilitics`, `other`

> ⚠️ **Known typo in the schema:** the politics category is stored as `"poilitics"` (two i's). You **must** send this exact string — sending `"politics"` will result in a 400 validation error.

**Renewal date auto-calculation**

If `renewalDate` is not supplied it is calculated from `startDate`:

| Frequency | Days Added |
|---|---|
| `daily` | +1 |
| `weekly` | +7 |
| `monthly` | +30 |
| `yearly` | +365 |

If the calculated (or provided) `renewalDate` is already in the past, `status` is automatically set to `"expired"`.

**Response — 201 Created**

```json
{
  "success": true,
  "data": {
    "subscription": {
      "_id": "664a2c3d5f6789012345ef01",
      "name": "Netflix",
      "price": 15.99,
      "currency": "USD",
      "frequency": "monthly",
      "category": "entertainment",
      "paymentMethod": "credit card",
      "status": "active",
      "startDate": "2024-01-01T00:00:00.000Z",
      "renewalDate": "2024-02-01T00:00:00.000Z",
      "user": "663f1a2b4e1234567890abcd",
      "createdAt": "2024-05-11T10:00:00.000Z",
      "updatedAt": "2024-05-11T10:00:00.000Z"
    },
    "workflowRunId": "wfr_xxxxxxxxxxxx"
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 401 | `"Unauthorized"` |
| 400 | Mongoose validation message |

---

### GET /subscriptions/user/:id

Get all subscriptions belonging to a user. The authenticated user can only retrieve their own subscriptions.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | string | MongoDB ObjectId of the user (must match the token owner) |

**Headers**

```
Authorization: Bearer <token>
```

**Response — 200 OK**

```json
{
  "success": true,
  "data": [
    {
      "_id": "664a2c3d5f6789012345ef01",
      "name": "Netflix",
      "price": 15.99,
      "currency": "USD",
      "frequency": "monthly",
      "category": "entertainment",
      "paymentMethod": "credit card",
      "status": "active",
      "startDate": "2024-01-01T00:00:00.000Z",
      "renewalDate": "2024-02-01T00:00:00.000Z",
      "user": "663f1a2b4e1234567890abcd",
      "createdAt": "2024-05-11T10:00:00.000Z",
      "updatedAt": "2024-05-11T10:00:00.000Z"
    }
  ]
}
```

**Errors**

| Status | Message |
|---|---|
| 401 | `"Unauthorized"` — token missing, invalid, or does not match `:id` |

---

### PUT /subscriptions/:id

Update any field of an existing subscription. Only the owner (the user who created it) can update it.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | string | MongoDB ObjectId of the subscription |

**Headers**

```
Authorization: Bearer <token>
```

**Request body** — include only the fields you want to change:

```json
{
  "price": 18.99,
  "status": "active"
}
```

**Response — 200 OK**

```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "data": {
    "_id": "664a2c3d5f6789012345ef01",
    "name": "Netflix",
    "price": 18.99,
    "status": "active",
    "...": "..."
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 401 | `"Unauthorized"` |
| 404 | `"Subscription not found or you are not authorized to update it"` |

---

### PUT /subscriptions/:id/cancel

Cancel a subscription. Sets `status` to `"cancelled"`. Only the owner can cancel.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | string | MongoDB ObjectId of the subscription |

**Headers**

```
Authorization: Bearer <token>
```

No request body required.

**Response — 200 OK**

```json
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

**Errors**

| Status | Message |
|---|---|
| 401 | `"Unauthorized"` |
| 404 | `"Subscription not found or you are not authorized to cancel it"` |

---

## Workflow Endpoints

### POST /workflows/subscription/reminder

Internal webhook consumed by Upstash Workflow. It is **not** called directly by the frontend — it is triggered automatically when a subscription is created.

The workflow sends reminder emails to the subscription owner at:

- 7 days before renewal
- 5 days before renewal
- 2 days before renewal
- 1 day before renewal

The workflow halts early if the subscription is cancelled/expired or the renewal date has already passed.

---

## Data Models

### User

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `name` | string | 2–50 chars |
| `email` | string | Unique, lowercase |
| `password` | string | Bcrypt hashed (never returned in user-facing responses) |
| `createdAt` | Date | Auto-managed |
| `updatedAt` | Date | Auto-managed |

### Subscription

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `name` | string | 2–50 chars |
| `price` | number | >= 0 |
| `currency` | string | `"USD"` \| `"INR"` \| `"EUR"` |
| `frequency` | string | `"daily"` \| `"weekly"` \| `"monthly"` \| `"yearly"` |
| `category` | string | `"sports"` \| `"news"` \| `"entertainment"` \| `"lifestyle"` \| `"technology"` \| `"finance"` \| `"poilitics"` \| `"other"` (**exact strings, note the typo in "poilitics"**) |
| `paymentMethod` | string | Free text |
| `status` | string | `"active"` \| `"cancelled"` \| `"expired"` |
| `startDate` | Date | Must be <= current time (past or present) — schema validator checks `value <= new Date()` |
| `renewalDate` | Date | Auto-calculated if omitted |
| `user` | ObjectId | Reference to `User._id` |
| `createdAt` | Date | Auto-managed |
| `updatedAt` | Date | Auto-managed |

---

## Frontend Integration Guide

### 1. Store and attach the JWT

After sign-in or sign-up, save the returned token and attach it to every protected request:

```js
// Save the token (example: localStorage)
localStorage.setItem('token', data.token);

// Attach to fetch requests
const token = localStorage.getItem('token');

const response = await fetch('/api/v1/subscriptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(subscriptionPayload),
});
```

### 2. Typical auth flow

```
[Sign Up / Sign In]
       │
       ▼
 Save token + userId
       │
       ▼
[GET /users/:userId]      ← verify user info on app load
[GET /subscriptions/user/:userId]  ← load dashboard
```

### 3. Creating a subscription (minimal example)

```js
const payload = {
  name: 'Spotify',
  price: 9.99,
  currency: 'USD',
  frequency: 'monthly',
  category: 'entertainment',
  paymentMethod: 'debit card',
  startDate: new Date('2024-01-01').toISOString(),
  // renewalDate is optional — auto-calculated server-side
};

const res = await fetch('/api/v1/subscriptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});

const { success, data } = await res.json();
```

### 4. Handling errors consistently

```js
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || 'An unexpected error occurred');
  }

  return json.data;
}
```

### 5. Logout

The backend sign-out endpoint is not yet fully implemented. Handle logout entirely on the client:

```js
function logout() {
  localStorage.removeItem('token');
  // Redirect to login page
}
```

### 6. Axios base config (alternative to fetch)

```js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally (e.g., redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```
