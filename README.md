# e-Pharmacy API

An Express + Mongoose backend for an e-commerce pharmacy experience: user registration & authentication (JWT access/refresh), product catalog with search & pagination, geospatial store lookup, and customer cart management with stock validation.

> **Repository:** https://github.com/Sailortr/epharmacy-client-api.git
> **Swagger UI (local):** http://localhost:3000/api-docs
> **LIVE RENDER.COM :** https://epharmacy-client-api.onrender.com/DOCS/

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Requirements](#requirements)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Run](#run)
- [Database Utilities](#database-utilities)
- [API Documentation (Swagger/OpenAPI)](#api-documentation-swaggeropenapi)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Auth](#auth)
  - [Products](#products)
  - [Stores](#stores)
  - [Cart](#cart)
- [Validation & Error Model](#validation--error-model)
- [Security, Logging & Performance](#security-logging--performance)
- [Testing & Coverage](#testing--coverage)
  - [Node Test Runner](#node-test-runner)
  - [Coverage Gates](#coverage-gates)
  - [Apidog Test Summary](#apidog-test-summary)
- [NPM Scripts](#npm-scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**e-Pharmacy API** powers client applications with secure auth flows, robust product discovery, and a transactional cart that enforces stock constraints. The project is production-minded, featuring strict input validation, consistent error semantics, security headers, rate limiting, and structured logging.

---

## Key Features

- **JWT Auth** with access & refresh tokens
- **User registration/login** with password hashing
- **Product catalog**: filtering (`brand`, text search `q`), pagination, limits
- **Cart**: add/update/remove items, stock checks, idempotent operations
- **Store locator**: nearby stores using `lng/lat` and distance filters
- **OpenAPI/Swagger UI** (browsable docs)
- **Hardening**: Helmet, CORS, rate limiting, gzip compression
- **Logging**: structured HTTP logs
- **Integration & API tests** with coverage

---

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 4
- **DB/Mappings**: MongoDB 6.x client & Mongoose 8.x
- **Validation**: Joi
- **Auth**: jsonwebtoken
- **Password Hashing**: bcryptjs
- **Logging**: pino / pino-http
- **Security**: helmet, express-rate-limit, cors, compression
- **Docs**: swagger-ui-express (+ YAML via yamljs)
- **Testing**: Node’s built-in test runner (`node --test`), Supertest, c8 coverage
- **Local test DB**: mongodb-memory-server
- **Lint/Format**: eslint, prettier

---

## Architecture

- `src/server.js` — App bootstrap
- `src/controllers/*` — Route handlers (auth, cart, product, etc.)
- `src/middlewares/*` — Validation (`validate.js`), auth guard (`auth.js`), error handling
- `src/models/*` — Mongoose schemas (User, Product, Store, Cart, etc.)
- `src/scripts/*` — DB utilities (seed, wipe, ensure indexes)
- `src/docs/openapi.yaml` — OpenAPI definition (adjust path if different)

---

## Getting Started

### Requirements

- **Node.js >= 20**
- **MongoDB** (if not using in-memory server for tests)

> Optional `package.json` engines: `"engines": { "node": ">=20.11" }`

### Environment Variables

Create a `.env` file:

```bash
# Server
PORT=3000
NODE_ENV=development

# Mongo
MONGODB_URI=mongodb://localhost:27017/epharmacy

# JWT
JWT_ACCESS_SECRET=replace-with-strong-secret
JWT_REFRESH_SECRET=replace-with-strong-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate limit (example)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

---

### Installation

git clone https://github.com/Sailortr/epharmacy-client-api.git
cd epharmacy-client-api
npm install

---

### Run

# Development with nodemon

npm run dev

# Production

npm start

# Health check

curl http://localhost:3000/health

---

### Database Utilities

# Ensure indexes

npm run db:index

# Seed demo data

npm run seed

# Wipe local database (dangerous; use with care)

npm run wipe

---

API Documentation (Swagger/OpenAPI)

Swagger UI (local): http://localhost:3000/api-docs

OpenAPI YAML: src/docs/openapi.yaml (adjust if your path differs)

If deploying under a different base URL, update servers in the OpenAPI file and any reverse-proxy settings accordingly.

---

Authentication

Access Token (short-lived) returned on login.

Refresh Token (longer-lived) to mint new access tokens.

### Header usage

Authorization: Bearer <accessToken>

---

Endpoints

The following endpoints are aligned with the logs and tests provided.

Health
Method Path Auth Description
GET /health — Liveness probe (200 OK).
Auth
Method Path Auth Description Notes
POST /api/user/register — Create user Body: {name, email, password, confirmPassword}. Errors: 400 validation; 409 duplicate email.
POST /api/user/login — Login, return {accessToken, refreshToken} Errors: 401 invalid credentials / missing fields.
POST /api/auth/refresh — Exchange refresh for new access token Errors: 401 invalid/corrupted refresh token.

### Examples

curl -X POST http://localhost:3000/api/user/register \
 -H "Content-Type: application/json" \
 -d '{"name":"Alice","email":"alice@example.com","password":"Passw0rd!","confirmPassword":"Passw0rd!"}'

curl -X POST http://localhost:3000/api/user/login \
 -H "Content-Type: application/json" \
 -d '{"email":"alice@example.com","password":"Passw0rd!"}'

Products
Method Path Auth Description Notes
GET /api/products — List products Query: page, limit, brand, q. Returns pagination meta.
GET /api/products/:id — Get product by ID Errors: 400 invalid ObjectId; 404 not found.

Validation: tags is not an allowed query parameter (400).

### Examples

curl "http://localhost:3000/api/products?limit=5"
curl "http://localhost:3000/api/products?page=2&limit=3"
curl "http://localhost:3000/api/products?brand=ACME&limit=50"
curl "http://localhost:3000/api/products?q=vit&limit=50"

Stores
Method Path Auth Description Notes
GET /api/stores/nearest — Nearest stores by coordinates Query: lng, lat, max (meters), limit.

### Examples

curl "http://localhost:3000/api/stores/nearest?lng=29.025&lat=41.043&max=4000&limit=5"

Cart
Method Path Auth Description Notes
GET /api/cart ✔ Get current user’s cart Errors: 401 without token.
PUT /api/cart/update ✔ Add/update/remove items in cart Body: { items: [{ productId, qty }] }. qty: 0 removes the item (idempotent). Errors: 400 invalid productId; 404 product not found; 409 insufficient stock.

### Examples

# Get cart

curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:3000/api/cart

# Update cart (set quantity)

curl -X PUT http://localhost:3000/api/cart/update \
 -H "Authorization: Bearer <ACCESS_TOKEN>" \
 -H "Content-Type: application/json" \
 -d '{"items":[{"productId":"68e7c59c6f7e993b018155b9","qty":2}]}'

---

Validation & Error Model

Validation (Joi) ensures strict input schemas. Typical messages:

"name" is required

"confirmPassword" must be [ref:password]

"productId" must only contain hexadecimal characters & length 24

"params.id" must only contain hexadecimal characters & length 24

Domain errors:

409 Conflict: duplicate email, insufficient stock

401 Unauthorized: missing/invalid credentials, invalid refresh token

404 Not Found: missing product, etc.

The centralized error handler returns structured errors (BadRequestError, UnauthorizedError, ConflictError, NotFoundError) and responses include security headers.

---

Security, Logging & Performance

Helmet: CSP and standard security headers

Rate limiting: express-rate-limit

CORS: configurable CORS_ORIGIN

Compression: gzip responses (compression)

Logging: pino-http structured logs (method, path, latency, status)

Strict ID checks: ObjectId validation to prevent malformed access

---

Testing & Coverage
Node Test Runner

Uses Node’s built-in node --test with Supertest and mongodb-memory-server for isolated HTTP/integration tests.

# Run tests

npm test

Key behaviors verified by tests and logs:

/api/user/register → 400 on missing fields; 409 on duplicate email; 201 on success

/api/user/login → 401 on invalid credentials; 200 on success

/api/auth/refresh → 401 on invalid/corrupt refresh; 200 on success (new access token)

/api/cart → 401 without token; 200 with valid auth

/api/cart/update → 400 invalid productId; 404 product not found; 409 insufficient stock; 200 on success; qty:0 removes item idempotently

/api/products → pagination & filters; brand, q supported; tags rejected (400)

/api/products/:id → 400 invalid ObjectId; 404 not found

/health → 200 OK

Coverage Gates

Coverage is enforced via c8:

npm run test:ci

# c8 --check-coverage --branches 80 --lines 85 --functions 85 npm run test

Generate lcov + text:
npm run test:cov

# c8 -r text -r lcov npm run test

Adjust thresholds as needed. Exclude non-critical files if appropriate.

### Apidog Test Summary

External (mock) workflow for demonstration:

Tool: Apidog v2.7.40

Scenario: Test CRUD pet (mock demo)

Execution Time: 2025-10-08 18:35:04

Executed Requests: 6

Passed: 5 (83.33%)

Failed: 1 (16.67%)

Duration: 2.20s (avg ~274ms)

Total Response Size: 3.59KB

Failure Detail

Step: Validate the updation (GET /pets/44)

Assertion: Pet status is updated to "sold"

Error: expected 'available' to deeply equal 'sold'

Note: The prior PUT /pets/44 did not persist the status in the mock. Update the mock state or add a delay/re-fetch strategy.

This Apidog report targets a mock URL, separate from the e-Pharmacy API. Included here as an external test artifact summary.

---

### NPM Scripts

{
"dev": "nodemon src/server.js",
"start": "node src/server.js",
"db:index": "node src/scripts/ensure-indexes.js",
"seed": "node src/scripts/seed.js",
"wipe": "node src/scripts/wipe.js",
"lint": "eslint .",
"test": "cross-env NODE\*ENV=test node --test test/\*\*/\_.test.js --test-concurrency=1 --test-reporter=spec --test-timeout=120000",
"test:cov": "c8 -r text -r lcov npm run test",
"test:ci": "c8 --check-coverage --branches 80 --lines 85 --functions 85 npm run test"
}

---

Contributing

Fork the repo and create a feature branch.

Run npm run lint and npm test locally.

Open a PR with a clear description and screenshots/logs if relevant.

---

License

Specify your license (e.g., MIT) and include a LICENSE file in the repository.

---

Developer by UZUNOGLU, Muhammet (Sailortr)
muhammetuzunoglu@gmail.com
