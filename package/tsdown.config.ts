import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts"],
	dts: true,
	unbundle: true,
	clean: true,
	treeshake: true,
});
