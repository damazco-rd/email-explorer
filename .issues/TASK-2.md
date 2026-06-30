---
title: Add resend as another provider option for sending emails
status: TODO
dependencies: none
---

# Agent Specification

| Service Name |
|---|
| email-explorer |

Your task is to introduce resend as another provider option for sending email. User can inform resend as a provider at runtime in the email explorer config option. Cloudflare must be kept as default option.

## Detailed Plan

### Goal
Add Resend as an opt-in email-sending provider. Users set `provider: "resend"` in `EmailExplorerOptions` and supply `RESEND_API_KEY` as a Wrangler secret. Cloudflare Email Routing remains the default; no breaking changes for existing deployments.

### Steps

**1. `packages/worker/src/types.ts`**
- Export `EmailProvider = "cloudflare" | "resend"` as a named type alias.
- Change `provider?: "cloudflare"` → `provider?: EmailProvider` in `EmailExplorerOptions`.
- Make `SEND_EMAIL?: SendEmail` optional in `Env` (Resend users won't have this binding).
- Add `RESEND_API_KEY?: string` to `Env`.

**2. `packages/worker/src/email-client/interface.ts`**
- Extend `SendEmailParams` with structured fields needed by Resend's JSON API:
  `subject`, `html?`, `text?`, `attachments?` (alongside the existing `mimeMessage` kept for Cloudflare).

**3. `packages/worker/src/email-client/resend.ts` (new file)**
- Implement `ResendEmailClient implements EmailClient`.
- `send()` calls `POST https://api.resend.com/emails` with `Authorization: Bearer <apiKey>` and a JSON body.
- Throws on non-2xx responses.

**4. `packages/worker/src/email-client/factory.ts`**
- Add explicit `case "resend"` → `ResendEmailClient(env.RESEND_API_KEY)`.
- Add guard on `default` (cloudflare) case to throw if `SEND_EMAIL` binding is missing.
- Import `EmailProvider` from types.

**5. Call sites — pass structured fields to `.send()`**
- `src/index.ts` `PostEmail.handle()` (~L550)
- `src/routes/reply-forward.ts` `PostReplyEmail.handle()` and `PostForwardEmail.handle()`

All three already have the structured data parsed from the request body; they just need to spread it into the `send()` call alongside `mimeMessage`.

### What Is Not Changing
- `buildMimeMessage()` and MIME logic
- Cloudflare wrangler bindings for existing users
- API routes, request/response schemas, Durable Object storage
- Auth and account-recovery flows

### Verification
1. `pnpm -C packages/worker tsc --noEmit` — zero errors
2. `pnpm run test` — all green
3. Smoke test with default (no provider) → Cloudflare sends as before
4. Smoke test with `provider: "resend"` + `RESEND_API_KEY` secret → delivery confirmed in Resend dashboard