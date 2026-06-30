import type { Attachment, EmailClient, SendEmailParams } from "./interface";

export class ResendEmailClient implements EmailClient {
	constructor(private readonly apiKey: string) {}

	async send({
		from,
		to,
		subject,
		html,
		text,
		attachments,
	}: SendEmailParams): Promise<void> {
		const body: Record<string, unknown> = { from, to, subject };
		if (html) body.html = html;
		if (text) body.text = text;
		if (attachments?.length) {
			body.attachments = attachments.map(
				({ filename, content }: Attachment) => ({
					filename,
					content,
				}),
			);
		}

		const response = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const message = await response.text();
			throw new Error(`Resend API error ${response.status}: ${message}`);
		}
	}
}
