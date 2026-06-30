import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
	esbuild: {
		target: "esnext",
	},
	plugins: [
		cloudflareTest({
			wrangler: { configPath: "./dev/wrangler.jsonc", },
			miniflare: {
				r2Persist: false,
				compatibilityFlags: ["nodejs_compat", "nodejs_als"],
				serviceBindings: {
					async SEND_EMAIL() {
						return {};
					},
				},
			},
		}),
	],
	test: {
		globalSetup: ["./tests/globalSetup.ts"],
		coverage: {
			provider: "istanbul"
		},
	},
});
