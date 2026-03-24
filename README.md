# STS-Backend — Subscription Tracking System

A RESTful API backend for tracking and managing recurring subscriptions. It handles user authentication, subscription lifecycle management, and automated email reminders before renewal dates.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Overview](#api-overview)
- [Full API Reference](#full-api-reference)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js ~4.16 |
| Database | MongoDB + Mongoose 8 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| Scheduled tasks | Upstash QStash / Workflow |
| Rate limiting | Arcjet |
| Dev tooling | Nodemon, ESLint |

---

## Project Structure

```
STS-backend/
├── app.js                      # Express app entry point
├── config/
│   ├── env.js                  # Loads .env variables
│   ├── arcjet.js               # Rate-limiting & bot-detection setup
│   ├── nodemailer.js           # Email transporter config
│   └── upstash.js              # Upstash workflow client config
├── routes/
│   ├── auth.routes.js          # /api/v1/auth
│   ├── user.routes.js          # /api/v1/users
│   ├── subscription.routes.js  # /api/v1/subscriptions
│   └── workflow.routes.js      # /api/v1/workflows
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── subscription.controller.js
│   └── workflow.controller.js
├── models/
│   ├── user.model.js           # User schema
│   └── subscription.model.js   # Subscription schema
├── middlewares/
│   ├── auth.middleware.js      # JWT verification → req.user
│   ├── arcjet.middleware.js    # Rate limiting / bot detection
│   └── error.middleware.js     # Global error handler
├── database/
│   └── mongodb.js              # MongoDB connection helper
└── utils/
    ├── send-email.js           # Email dispatch helper
    └── email-template.js       # HTML email templates
```

**Architecture:** MVC — Models → Controllers → Routes → Middlewares.

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- [Upstash](https://upstash.com/) account (free tier — for reminder workflows)
- [Arcjet](https://app.arcjet.com/) account (free tier — for rate limiting)
- Gmail account with an [App Password](https://myaccount.google.com/apppasswords) configured

### Install Dependencies

```bash
npm install
```

### Configure Environment

Copy the template and fill in your values:

```bash
cp .env.example .env.development.local
```

See [Environment Variables](#environment-variables) for what each key does.

---

## Environment Variables

The app loads `.env.{NODE_ENV}.local` (defaults to `.env.development.local`).

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
DB_URI=mongodb://localhost:27017/subscriptionDB

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Arcjet (rate limiting)
ARCJET_KEY=ajkey_xxxxxxxxxxxx
ARCJET_ENV=development

# Upstash QStash (reminder workflows)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=sig_xxxx
QSTASH_NEXT_SIGNING_KEY=sig_xxxx

# Public server URL — used by Upstash to call back into the app
SERVER_URL=http://localhost:3000

# Gmail App Password (not your normal password)
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

> **Note:** For production set `NODE_ENV=production` and create `.env.production.local`.

---

## Running the Server

```bash
# Development (auto-reload via nodemon)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:{PORT}` (default `3000`).  
A `GET /` returns `"Welcome to the subscription tracking system"`.

---

## API Overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/sign-up` | — | Register a new user |
| POST | `/api/v1/auth/sign-in` | — | Login and receive JWT |
| POST | `/api/v1/auth/sign-out` | — | Logout (placeholder) |
| GET | `/api/v1/users` | — | List all users |
| GET | `/api/v1/users/:id` | ✅ | Get a single user |
| POST | `/api/v1/subscriptions` | ✅ | Create a subscription |
| GET | `/api/v1/subscriptions/user/:id` | ✅ | Get subscriptions for a user |
| PUT | `/api/v1/subscriptions/:id` | ✅ | Update a subscription |
| PUT | `/api/v1/subscriptions/:id/cancel` | ✅ | Cancel a subscription |
| POST | `/api/v1/workflows/subscription/reminder` | — | Upstash reminder webhook |

> ✅ = requires `Authorization: Bearer <token>` header

See the [full API reference](./API.md) for detailed request/response shapes and error codes.

---

## Full API Reference

See **[API.md](./API.md)** for complete endpoint documentation with request bodies, response shapes, error codes, and frontend integration examples.
