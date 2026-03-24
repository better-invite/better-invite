import path from "node:path";
import { createOpenAPI } from "fumadocs-openapi/server";

export const openapi = createOpenAPI({
	// the OpenAPI schema, you can also give it an external URL.
	input: [path.resolve("./openapi.yaml")],
	proxyUrl: "/api/proxy",
});
