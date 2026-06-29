import { EmailMessage } from "cloudflare:email";
import type { EmailClient, SendEmailParams } from "./interface";

export class CloudflareEmailClient implements EmailClient {
	constructor(private readonly sendEmail: SendEmail) {}

	async send({ from, to, mimeMessage }: SendEmailParams): Promise<void> {
		await this.sendEmail.send(new EmailMessage(from, to, mimeMessage));
	}
}
