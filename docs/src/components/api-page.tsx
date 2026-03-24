import { createAPIPage } from "fumadocs-openapi/ui";
import { openapi } from "@/lib/openapi";

export const APIPage = createAPIPage(openapi, {
	playground: {
		// Maybe add in future?
		enabled: false,
	},
});
