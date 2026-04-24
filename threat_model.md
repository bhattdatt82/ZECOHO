# Threat Model

## Project Overview

ZECOHO is a full-stack hotel booking platform built with a React/Vite frontend and an Express/TypeScript backend backed by PostgreSQL via Drizzle ORM. It serves guests, property owners, sub-admins, and full admins, and includes authentication, KYC workflows, property listing management, bookings, messaging, notifications, waitlist handling, and subscription management.

Production scope is the built SPA plus the Express API started from `server/index-prod.ts`, with route and websocket registration in `server/routes.ts` and shared auth/session handling in `server/replitAuth.ts`. Per scan assumptions, `NODE_ENV=production` in production, Replit-provided TLS is present, and mockup or sandbox-only surfaces are out of scope unless production reachability is demonstrated.

## Assets

- **User accounts and sessions** — authenticated sessions, password hashes, OTP codes, Replit/OIDC session state, and role assignments. Compromise enables account takeover or admin access.
- **Administrative authority** — admin and sub-admin permissions, moderation actions, exports, policy management, subscription activation, and user lifecycle controls. Compromise would expose most platform data and control.
- **Owner compliance and KYC data** — identity documents, ownership proofs, rejection notes, and verification state. This is highly sensitive personal and business data.
- **Booking and messaging data** — guest identities, contact details, booking records, conversations, notification payloads, invoices, and refund details.
- **Property and subscription business data** — property drafts, listing status, owner subscriptions, referral rewards, invoices, and inventory/availability state.
- **Application secrets and integrations** — database credentials, session secret, upload token secret, OIDC configuration, Google/object storage credentials, Resend credentials, push notification keys.
- **Uploaded files and media** — property images, KYC documents, message attachments, logos, and payment screenshots stored through object storage.

## Trust Boundaries

- **Browser to Express API** — all client input is untrusted and must be validated server-side for auth, authorization, and business rules.
- **Express API to PostgreSQL** — route handlers and the storage layer can read or mutate all application data; broken authorization here becomes direct data compromise.
- **Express API to object storage** — upload URLs, ACL metadata, and object fetch routes cross a file-access boundary and can expose sensitive uploads if mishandled.
- **Public vs authenticated vs owner vs admin** — many routes are intended for different roles; server-side enforcement is required regardless of frontend guards.
- **Express API to external providers** — Replit OIDC, Google auth tokens, Resend email, web-push, and geolocation/network helpers all require origin and data validation.
- **HTTP to WebSocket upgrade** — websocket connections reuse session state and must authenticate the user consistently with the REST API.

## Scan Anchors

- **Production entry points:** `server/index-prod.ts`, `server/app.ts`, `server/routes.ts`, `server/subscriptions.ts`, `server/replitAuth.ts`.
- **Highest-risk areas:** custom auth routes in `server/routes.ts`; session handling in `server/replitAuth.ts`; admin/subscription controls in `server/routes.ts` and `server/subscriptions.ts`; object storage in `server/objectStorage.ts` and `server/objectAcl.ts`; KYC, booking, and messaging flows in `server/routes.ts`; data access in `server/storage.ts`.
- **Public surfaces:** property browsing, destinations, reviews, some analytics and site content routes, auth initiation, forgot/reset password, and object fetches for public files.
- **Authenticated/privileged surfaces:** user profile, bookings, conversations/messages, owner property management, KYC submission, notifications, admin exports/content moderation, subscription activation, and user administration.
- **Usually dev-only or low-priority unless proven reachable in production:** explicit test/dev endpoints, backup files (`*.bak*`), attached assets, seed scripts, and `client/src/pages/dev-admin-login.tsx`.

## Current Confirmed Hotspots

- `POST /api/auth/google` in `server/routes.ts` is a critical trust boundary because it creates sessions from an unverified Google token payload.
- `POST /api/admin/promote` in `server/routes.ts` is a critical privilege boundary because it changes `userRole` without authentication.
- Admin subscription routes in `server/subscriptions.ts` are a critical boundary because they are mounted into production under `/api` and currently lack admin enforcement.
- `GET /api/conversations` and `GET /api/properties` in `server/routes.ts` are high-risk data-exposure surfaces because they return broad objects assembled in `server/storage.ts`.
- `PATCH /api/bookings/:id/status` in `server/routes.ts` is a workflow-integrity boundary because it accepts sensitive state transitions without validating the allowed actor or transition path.

## Threat Categories

### Spoofing

This project has several custom authentication paths in addition to OIDC, including OTP, password login, Google sign-in, and session-backed websockets. The backend must verify the authenticity, issuer, audience, and expiry of third-party tokens; session state must only be created after successful server-side proof of identity; and websocket authentication must be equivalent to HTTP authentication.

### Tampering

Owners and admins can mutate listings, subscriptions, inventory, KYC records, policies, and booking state. The server must treat every request body, query parameter, uploaded object reference, and claimed identifier as untrusted. Sensitive state transitions such as admin promotion, subscription activation, property publication, refund calculation, and ACL changes must require explicit server-side authorization and must not rely on UI visibility or route naming.

### Information Disclosure

The platform stores PII, KYC documents, payment proofs, bookings, conversations, and admin exports. API responses, object storage ACLs, logs, and email templates must not expose data outside the intended user, owner, or admin audience. Public object routes and export endpoints are especially sensitive because a single missing check can disclose large volumes of data.

### Denial of Service

Public auth and discovery endpoints can be abused for OTP spam, brute-force attempts, scraping, and request flooding. The application must apply effective rate limits and avoid unauthenticated expensive operations, particularly around auth workflows, search/discovery, and file handling.

### Elevation of Privilege

The largest risk in this codebase is broken access control across role boundaries. Full-admin and sub-admin actions, owner-only listing and booking operations, and guest-specific booking or messaging data must all be enforced on the server. Any route that can change `userRole`, activate subscriptions, publish listings, access exports, or alter ACLs must require authenticated users with the correct role or permission set.
