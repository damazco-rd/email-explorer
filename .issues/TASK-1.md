---
title: Centralize email sending in a client for using different providers
status: In Review
dependencies: none
---

# Agent Specification

| Service Name |
|---|
| email-explorer |

Your task is to create an email abstraction client for sending emails with the purpose to use different providers during runtime.

Use a factory pattern to allow which provider to use. Extend the email explorer config to introduce a new optional attribute for defining the provider. As default use `cloudflare` as provider.

## Detailed Plan

### Files to Create

**`packages/worker/src/email-client/interface.ts`**
Defines the shared contract:
```ts
export interface SendEmailParams {
  from: string;
  to: string;
  mimeMessage: string;
}

export interface EmailClient {
  send(params: SendEmailParams): Promise<void>;
}
```

**`packages/worker/src/email-client/cloudflare.ts`**
Implements `EmailClient` using the existing Cloudflare binding:
```ts
import { EmailMessage } from 'cloudflare:email';
export class CloudflareEmailClient implements EmailClient {
  constructor(private readonly sendEmail: SendEmail) {}
  async send({ from, to, mimeMessage }: SendEmailParams) {
    await this.sendEmail.send(new EmailMessage(from, to, mimeMessage));
  }
}
```

**`packages/worker/src/email-client/factory.ts`**
Reads `env.config?.provider` (default `'cloudflare'`) and returns the right client:
```ts
export function createEmailClient(env: Env): EmailClient {
  switch (env.config?.provider ?? 'cloudflare') {
    case 'cloudflare':
    default:
      return new CloudflareEmailClient(env.SEND_EMAIL);
  }
}
```

**`packages/worker/src/email-client/index.ts`**
Re-exports `createEmailClient`, `EmailClient`, `SendEmailParams`.

### Files to Modify

**`packages/worker/src/types.ts`** — Add `provider` to `EmailExplorerOptions`:
```ts
provider?: 'cloudflare';
```

**`packages/worker/src/index.ts`**
- Add import: `import { createEmailClient } from './email-client';`
- Remove `import { EmailMessage } from 'cloudflare:email'` (moved into provider)
- Replace 2 inline send blocks with `createEmailClient(c.env).send({ from, to: toStr, mimeMessage })`

**`packages/worker/src/routes/reply-forward.ts`**
- Same: import `createEmailClient`, remove `EmailMessage` import, replace 2 inline send blocks.

### Verification

1. `npm run check` (biome formatter + linter) must pass
2. `npm run test` in `packages/worker` must pass
3. Manual check: all 4 send sites use the client instead of the raw binding