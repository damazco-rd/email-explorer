export function setup() {
	const originalWrite = process.stdout.write.bind(process.stdout);
	(process.stdout.write as typeof process.stdout.write) = (chunk, ...args) => {
		if (chunk.toString().includes("send_email binding called")) return true;
		return originalWrite(chunk, ...args as []);
	};
}
