export interface SendEmailParams {
	from: string;
	to: string;
	mimeMessage: string;
}

export interface EmailClient {
	send(params: SendEmailParams): Promise<void>;
}
