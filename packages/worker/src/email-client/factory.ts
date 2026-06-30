import type { EmailProvider, Env } from "../types";
import { CloudflareEmailClient } from "./cloudflare";
import type { EmailClient } from "./interface";
import { ResendEmailClient } from "./resend";

export function createEmailClient(env: Env): EmailClient {
	const provider: EmailProvider = env.config?.provider ?? "cloudflare";
	switch (provider) {
		case "resend": {
			if (!env.RESEND_API_KEY) {
				throw new Error(
					'RESEND_API_KEY secret is required when provider is "resend"',
				);
			}
			return new ResendEmailClient(env.RESEND_API_KEY);
		}
		default: {
			if (!env.SEND_EMAIL) {
				throw new Error(
					'SEND_EMAIL binding is required when provider is "cloudflare"',
				);
			}
			return new CloudflareEmailClient(env.SEND_EMAIL);
		}
	}
}
