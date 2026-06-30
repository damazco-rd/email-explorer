import { describe, expect, it, vi, afterEach } from "vitest";
import { ResendEmailClient } from "../../src/email-client/resend";
import { createEmailClient } from "../../src/email-client/factory";
import { CloudflareEmailClient } from "../../src/email-client/cloudflare";
import type { Env } from "../../src/types";

describe("ResendEmailClient", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should POST to the Resend API with the correct auth header", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("{}", { status: 200 }),
		);

		const client = new ResendEmailClient("my-api-key");
		await client.send({
			from: "sender@example.com",
			to: "recipient@example.com",
			subject: "Hello",
			text: "Body text",
			mimeMessage: "",
		});

		expect(fetchSpy).toHaveBeenCalledOnce();
		const [url, init] = fetchSpy.mock.calls[0];
		expect(url).toBe("https://api.resend.com/emails");
		expect(init?.method).toBe("POST");
		const headers = init?.headers as Record<string, string>;
		expect(headers["Authorization"]).toBe("Bearer my-api-key");
		expect(headers["Content-Type"]).toBe("application/json");
	});

	it("should include from, to, and subject in the request body", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("{}", { status: 200 }),
		);

		const client = new ResendEmailClient("key");
		await client.send({
			from: "a@a.com",
			to: "b@b.com",
			subject: "Test Subject",
			mimeMessage: "",
		});

		const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
		expect(body.from).toBe("a@a.com");
		expect(body.to).toBe("b@b.com");
		expect(body.subject).toBe("Test Subject");
	});

	it("should include html in the payload when provided", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("{}", { status: 200 }),
		);

		const client = new ResendEmailClient("key");
		await client.send({
			from: "a@a.com",
			to: "b@b.com",
			subject: "S",
			html: "<b>Hello</b>",
			mimeMessage: "",
		});

		const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
		expect(body.html).toBe("<b>Hello</b>");
		expect(body.text).toBeUndefined();
	});

	it("should include text in the payload when provided", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("{}", { status: 200 }),
		);

		const client = new ResendEmailClient("key");
		await client.send({
			from: "a@a.com",
			to: "b@b.com",
			subject: "S",
			text: "plain text",
			mimeMessage: "",
		});

		const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
		expect(body.text).toBe("plain text");
		expect(body.html).toBeUndefined();
	});

	it("should map attachments keeping only filename and content", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("{}", { status: 200 }),
		);

		const client = new ResendEmailClient("key");
		await client.send({
			from: "a@a.com",
			to: "b@b.com",
			subject: "S",
			mimeMessage: "",
			attachments: [
				{
					filename: "file.txt",
					content: "dGVzdA==",
					type: "text/plain",
					disposition: "attachment",
				},
			],
		});

		const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
		expect(body.attachments).toEqual([
			{ filename: "file.txt", content: "dGVzdA==" },
		]);
	});

	it("should omit attachments key when the array is empty", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("{}", { status: 200 }),
		);

		const client = new ResendEmailClient("key");
		await client.send({
			from: "a@a.com",
			to: "b@b.com",
			subject: "S",
			mimeMessage: "",
			attachments: [],
		});

		const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
		expect(body.attachments).toBeUndefined();
	});

	it("should throw with status and error body on a non-ok response", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("Invalid API key", { status: 401 }),
		);

		const client = new ResendEmailClient("bad-key");
		await expect(
			client.send({
				from: "a@a.com",
				to: "b@b.com",
				subject: "S",
				mimeMessage: "",
			}),
		).rejects.toThrow("Resend API error 401: Invalid API key");
	});

	it("should throw with 5xx status on server error", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("Internal Server Error", { status: 500 }),
		);

		const client = new ResendEmailClient("key");
		await expect(
			client.send({
				from: "a@a.com",
				to: "b@b.com",
				subject: "S",
				mimeMessage: "",
			}),
		).rejects.toThrow("Resend API error 500: Internal Server Error");
	});
});

describe("createEmailClient factory", () => {
	it("should return a ResendEmailClient when provider is resend", () => {
		const env = {
			config: { provider: "resend" },
			RESEND_API_KEY: "rk_test_abc",
		} as unknown as Env;

		const client = createEmailClient(env);
		expect(client).toBeInstanceOf(ResendEmailClient);
	});

	it("should throw when resend provider is selected but RESEND_API_KEY is missing", () => {
		const env = { config: { provider: "resend" } } as unknown as Env;

		expect(() => createEmailClient(env)).toThrow(
			'RESEND_API_KEY secret is required when provider is "resend"',
		);
	});

	it("should return a CloudflareEmailClient when provider is cloudflare", () => {
		const sendEmailMock = {} as SendEmail;
		const env = { SEND_EMAIL: sendEmailMock } as unknown as Env;

		const client = createEmailClient(env);
		expect(client).toBeInstanceOf(CloudflareEmailClient);
	});

	it("should throw when cloudflare provider has no SEND_EMAIL binding", () => {
		const env = {} as unknown as Env;

		expect(() => createEmailClient(env)).toThrow(
			'SEND_EMAIL binding is required when provider is "cloudflare"',
		);
	});
});
