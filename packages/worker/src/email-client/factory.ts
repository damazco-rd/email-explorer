import type { Env } from "../types";
import { CloudflareEmailClient } from "./cloudflare";
import type { EmailClient } from "./interface";

export function createEmailClient(env: Env): EmailClient {
	switch (env.config?.provider ?? "cloudflare") {
		default:
			return new CloudflareEmailClient(env.SEND_EMAIL);
	}
}
