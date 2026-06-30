export interface Attachment {
	filename: string;
	content: string;
	type?: string;
	disposition?: "attachment" | "inline";
	contentId?: string;
}

export interface SendEmailParams {
	from: string;
	to: string;
	mimeMessage: string;
	subject: string;
	html?: string;
	text?: string;
	attachments?: Attachment[];
}

export interface EmailClient {
	send(params: SendEmailParams): Promise<void>;
}
