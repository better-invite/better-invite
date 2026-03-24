import { Callout } from "fumadocs-ui/components/callout";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { TypeTable } from "fumadocs-ui/components/type-table";
import { Link } from "lucide-react";
import type { JSX } from "react";
import { cn } from "@/lib/cn";
import {
	ApiMethodTabs,
	ApiMethodTabsContent,
	ApiMethodTabsList,
	ApiMethodTabsTrigger,
} from "./api-method-tabs";
import { Endpoint } from "./endpoint";

type Property = {
	isOptional: boolean;
	description: string | null;
	defaultValue: string | null;
	propName: string;
	type: string;
	exampleValue: string | null;
	comments: string | null;
	isServerOnly: boolean;
	path: string[];
	isNullable: boolean;
	isClientOnly: boolean;
	deprecated?: boolean;
	link: string | null;
	params?: Record<string, unknown>;
	returns: string | null;
	ignore?: boolean;
};

const placeholderProperty: Property = {
	isOptional: false,
	comments: null,
	description: null,
	defaultValue: null,
	exampleValue: null,
	propName: "",
	type: "",
	isServerOnly: false,
	path: [],
	isNullable: false,
	isClientOnly: false,
	link: null,
	returns: null,
};

const indentationSpace = `    `;

export const APIMethod = ({
	path,
	isServerOnly,
	isClientOnly,
	isExternalOnly,
	method,
	children,
	noResult,
	requireSession,
	optionalSession,
	requireBearerToken,
	note,
	clientOnlyNote,
	serverOnlyNote,
	resultVariable = "data",
	forceAsBody,
	forceAsParam,
	forceAsQuery,
	fetchOptionsParams,
	clientMethod,
}: {
	/**
	 * Endpoint path
	 */
	path: string;
	/**
	 *  If enabled, we will add `headers` to the fetch options, indicating the given API method requires auth headers.
	 *
	 * @default false
	 */
	requireSession?: boolean;
	/**
	 *  If enabled, we will add `headers` to the fetch options, indicating the given API method can have auth headers.
	 *
	 * @default false
	 */
	optionalSession?: boolean;
	/**
	 *  If enabled, will add a bearer authorization header to the fetch options
	 *
	 * @default false
	 */
	requireBearerToken?: boolean;
	/**
	 * The HTTP method to the endpoint
	 *
	 * @default "GET"
	 */
	method?: "POST" | "GET" | "DELETE" | "PUT";
	/**
	 * Wether the endpoint is server only or not.
	 *
	 * @default false
	 */
	isServerOnly?: boolean;
	/**
	 * Wether the code example is client-only, thus meaning it's an endpoint.
	 *
	 * @default false
	 */
	isClientOnly?: boolean;
	/**
	 * Wether the code example is meant for external consumers
	 */
	isExternalOnly?: boolean;
	/**
	 * The `ts` codeblock which describes the API method.
	 * I recommend checking other parts of the Better-Auth docs which is using this component to get an idea of how to
	 * write out the children.
	 */
	children: JSX.Element;
	/**
	 * If enabled, will remove the `const data = ` part, since this implies there will be no return data from the API method.
	 */
	noResult?: boolean;
	/**
	 * A small note to display above the client-auth example code-block.
	 */
	clientOnlyNote?: string;
	/**
	 * A small note to display above the server-auth example code-block.
	 */
	serverOnlyNote?: string;
	/**
	 * A small note to display above both the client & server auth example code-blocks.
	 */
	note?: string;
	/**
	 * The result output variable name.
	 *
	 * @default "data"
	 */
	resultVariable?: string;
	/**
	 * Force the server auth API to use `body`, rather than auto choosing
	 */
	forceAsBody?: boolean;
	/**
	 * Force the server auth API to use `query`, rather than auto choosing
	 */
	forceAsQuery?: boolean;
	/**
	 * Force the server auth api to use `path`, rather than auto choosing
	 */
	forceAsParam?: boolean;
	/**
	 * Extra fetch options parameters to show in the example.
	 * @example ["token", "test"]
	 */
	fetchOptionsParams?: string[] | string;
	/**
	 * Overrides the client method name.
	 * @example invite[":token"]
	 */
	clientMethod?: string;
}) => {
	const { props, functionName, code_prefix, code_suffix } = parseCode(children);

	const authClientMethodPath = clientMethod ?? pathToDotNotation(path);

	const clientBody = createClientBody({
		props,
		method: method ?? "GET",
		forceAsBody,
		forceAsQuery,
		forceAsParam,
		fetchOptionsParams,
	});

	const serverBody = createServerBody({
		props,
		method: method ?? "GET",
		requireSession: requireSession ?? false,
		optionalSession: optionalSession ?? false,
		requireBearerToken: requireBearerToken ?? false,
		forceAsQuery,
		forceAsParam,
		forceAsBody,
		fetchOptionsParams,
	});

	const serverCodeBlock = (
		<DynamicCodeBlock
			code={`${code_prefix}${
				noResult ? "" : `const ${resultVariable} = `
			}await auth.api.${functionName}(${serverBody});${code_suffix}`}
			lang="ts"
			codeblock={{
				allowCopy: !isClientOnly,
				className: "rounded-b-lg rounded-t-none border-t-0",
			}}
		/>
	);

	const serverTabContent = (
		<>
			{isClientOnly || isServerOnly ? null : (
				<Endpoint
					method={method || "GET"}
					path={path}
					className="rounded-t-lg"
				/>
			)}
			{serverOnlyNote || note ? (
				<Note>
					{note && tsxifyBackticks(note)}
					{serverOnlyNote ? (
						<>
							{note ? <br /> : null}
							{tsxifyBackticks(serverOnlyNote)}
						</>
					) : null}
				</Note>
			) : null}
			<div className={cn("relative w-full")}>
				{serverCodeBlock}
				{isClientOnly ? (
					<div className="flex absolute inset-0 justify-center items-center w-full h-full rounded-lg border backdrop-brightness-50 backdrop-blur-xs border-border">
						<span>This is a client-only endpoint</span>
					</div>
				) : null}
			</div>
			{!isClientOnly ? (
				<TypeTable type={propsToTypeTable(props, true)} />
			) : null}
		</>
	);

	if (isExternalOnly) {
		return serverTabContent;
	}

	const pathId = path.replaceAll("/", "-");

	return (
		<>
			<div className="relative">
				<div
					id={`api-method${pathId}`}
					aria-hidden
					className="absolute invisible -top-25"
				/>
			</div>
			<ApiMethodTabs
				defaultValue={isServerOnly ? "server" : "client"}
				className="gap-0 w-full"
			>
				<ApiMethodTabsList className="group relative flex justify-start w-full p-0 bg-transparent">
					<ApiMethodTabsTrigger
						value="client"
						className="transition-all duration-150 ease-in-out max-w-25 data-[state=active]:bg-border hover:bg-border/50 bg-border/50 border hover:border-primary/15 cursor-pointer data-[state=active]:border-primary/10 rounded-none"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="1em"
							height="1em"
							viewBox="0 0 36 36"
							role="presentation"
							aria-hidden="true"
						>
							<path
								fill="currentColor"
								d="M23.81 26c-.35.9-.94 1.5-1.61 1.5h-8.46c-.68 0-1.26-.6-1.61-1.5H1v1.75A2.45 2.45 0 0 0 3.6 30h28.8a2.45 2.45 0 0 0 2.6-2.25V26Z"
							/>
							<path
								fill="currentColor"
								d="M7 10h22v14h3V7.57A1.54 1.54 0 0 0 30.5 6h-25A1.54 1.54 0 0 0 4 7.57V24h3Z"
							/>
							<path fill="none" d="M0 0h36v36H0z" />
						</svg>
						<span>Client</span>
					</ApiMethodTabsTrigger>
					<ApiMethodTabsTrigger
						value="server"
						className="transition-all duration-150 ease-in-out max-w-25 data-[state=active]:bg-border hover:bg-border/50 bg-border/50 border hover:border-primary/15 cursor-pointer data-[state=active]:border-primary/10 rounded-none"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="1em"
							height="1em"
							viewBox="0 0 24 24"
							role="presentation"
							aria-hidden="true"
						>
							<path
								fill="currentColor"
								d="M3 3h18v18H3zm2 2v6h14V5zm14 8H5v6h14zM7 7h2v2H7zm2 8H7v2h2z"
							/>
						</svg>
						<span>Server</span>
					</ApiMethodTabsTrigger>
					<div className="absolute right-0">
						<a
							href={`#api-method${pathId}`}
							className={cn(
								buttonVariants({ size: "icon", variant: "ghost" }),
								"opacity-0 transition-all duration-150 ease-in-out scale-80 group-hover:opacity-100",
							)}
						>
							<Link className="size-4" />
						</a>
					</div>
				</ApiMethodTabsList>
				<ApiMethodTabsContent value="client">
					{isServerOnly ? null : (
						<Endpoint
							method={method || "GET"}
							path={path}
							className="rounded-t-lg"
						/>
					)}
					{clientOnlyNote || note ? (
						<Note>
							{note && tsxifyBackticks(note)}
							{clientOnlyNote ? (
								<>
									{note ? <br /> : null}
									{tsxifyBackticks(clientOnlyNote)}
								</>
							) : null}
						</Note>
					) : null}
					<div className={cn("relative w-full")}>
						<DynamicCodeBlock
							code={`${code_prefix}${
								noResult
									? ""
									: `const { data${
											resultVariable === "data" ? "" : `: ${resultVariable}`
										}, error } = `
							}await authClient.${authClientMethodPath}(${clientBody});${code_suffix}`}
							lang="ts"
							codeblock={{
								allowCopy: !isServerOnly,
								className: "rounded-b-lg rounded-t-none border-t-0",
							}}
						/>
						{isServerOnly ? (
							<div className="flex absolute inset-0 justify-center items-center w-full h-full rounded-lg border backdrop-brightness-50 backdrop-blur-xs border-border">
								<span>This is a server-only endpoint</span>
							</div>
						) : null}
					</div>
					{!isServerOnly ? (
						<TypeTable type={propsToTypeTable(props, false)} />
					) : null}
				</ApiMethodTabsContent>
				<ApiMethodTabsContent value="server">
					{serverTabContent}
				</ApiMethodTabsContent>
			</ApiMethodTabs>
		</>
	);
};

function pathToDotNotation(input: string): string {
	return input
		.split("/") // split into segments
		.filter(Boolean) // remove empty strings (from leading '/')
		.map((segment) =>
			segment
				.split("-") // split kebab-case
				.map((word, i) =>
					i === 0
						? word.toLowerCase()
						: word.charAt(0).toUpperCase() + word.slice(1),
				)
				.join(""),
		)
		.join(".");
}

function getChildren(
	x:
		| ({ props: { children: string } } | string)
		| ({ props: { children: string } } | string)[],
): string[] {
	if (Array.isArray(x)) {
		const res = [];
		for (const item of x) {
			res.push(getChildren(item));
		}
		return res.flat();
	} else {
		if (typeof x === "string") return [x];
		return [x.props.children];
	}
}

import type { ReactNode } from "react";
import { buttonVariants } from "./ui/button";

function propsToTypeTable(props: Property[], isServer: boolean) {
	const entries = props
		.filter((prop) => {
			if (!isServer && prop.isServerOnly) return false;
			if (isServer && prop.isClientOnly) return false;
			return true;
		})
		.map((prop) => {
			const name = `${prop.path.join(".")}${prop.path.length ? "." : ""}${prop.propName}`;

			const uniqueKey = `${name}-${prop.type}`;

			const typeNode: ReactNode = (
				<code key={`type-${uniqueKey}`}>{prop.type}</code>
			);

			let fullType = prop.type;
			if (prop.isNullable) fullType += " | null";
			if (prop.isOptional) fullType += " | undefined";

			const typeDescription: ReactNode = (
				<code key={`type-desc-${uniqueKey}`}>{fullType}</code>
			);

			const descriptionNode: ReactNode | undefined = prop.description
				? tsxifyBackticks(prop.description)
				: undefined;

			const defaultNode: ReactNode | undefined = prop.defaultValue ? (
				<code key={`default-${uniqueKey}`}>{prop.defaultValue}</code>
			) : undefined;

			const parametersNode = prop.params
				? Object.entries(prop.params).map(([paramName, value]) => ({
						name: paramName,
						type: (
							<code key={`param-type-${uniqueKey}-${paramName}`}>
								{typeof value}
							</code>
						),
						description:
							value != null ? (
								<code key={`param-desc-${uniqueKey}-${paramName}`}>
									{String(value)}
								</code>
							) : undefined,
					}))
				: undefined;

			return [
				name,
				{
					description: descriptionNode,
					type: typeNode,
					typeDescription,
					typeDescriptionLink: prop.link ?? undefined,
					default: defaultNode,
					required: !prop.isOptional,
					deprecated: prop.deprecated ?? undefined,
					parameters: parametersNode,
					returns: prop.returns ? (
						<code key={`returns-${uniqueKey}`}>{prop.returns}</code>
					) : undefined,
				},
			] as const;
		});

	return Object.fromEntries(entries);
}

function tsxifyBackticks(input: string): JSX.Element {
	const parts = input.split(/(`[^`]+`)/g); // Split by backtick sections

	return (
		<>
			{parts.map((part) => {
				if (part.startsWith("`") && part.endsWith("`")) {
					const content = part.slice(1, -1); // remove backticks
					return <code key={`code-${content}`}>{content}</code>;
				} else {
					return <span key={`text-${part}`}>{part}</span>;
				}
			})}
		</>
	);
}

function parseCode(children: JSX.Element) {
	// These two variables are essentially taking the `children` JSX shiki code, and converting them to
	// an array string purely of it's code content.
	const arrayOfJSXCode = children?.props.children.props.children.props.children
		.map((x: unknown) =>
			x === "\n" ? { props: { children: { props: { children: "\n" } } } } : x,
		)
		.map((x: unknown) => (x as { props: { children: string } }).props.children)
		.filter((x: unknown) => x != null);
	const arrayOfCode: string[] = arrayOfJSXCode
		.flatMap(
			(
				x: { props: { children: string } } | { props: { children: string } }[],
			) => {
				return getChildren(x);
			},
		)
		.join("")
		.split("\n");

	const props: Property[] = [];

	let functionName: string = "";
	let currentJSDocDescription: string = "";
	let jsDocDefaultValue: string | null = null;
	let jsDocDeprecated = false;
	let jsDocLink: string | null = null;
	let jsDocParams: Record<string, unknown> | undefined;
	let jsDocReturns: string | null = null;
	let jsDocIgnore: boolean = false;

	let withinApiMethodType = false;
	let hasAlreadyDefinedApiMethodType = false;
	let isServerOnly_ = false;
	let isClientOnly_ = false;
	const nestPath: string[] = []; // str arr segmented-path, eg: ["data", "metadata", "something"]
	const serverOnlyPaths: string[] = []; // str arr full-path, eg: ["data.metadata.something"]
	const clientOnlyPaths: string[] = []; // str arr full-path, eg: ["data.metadata.something"]
	let isNullable = false;

	let code_prefix = "";
	let code_suffix = "";

	for (let line of arrayOfCode) {
		const originalLine = line;
		line = line.trim();
		if (line === "}" && withinApiMethodType && !nestPath.length) {
			withinApiMethodType = false;
			hasAlreadyDefinedApiMethodType = true;
			continue;
		} else {
			if (line === "}" && withinApiMethodType && nestPath.length) {
				nestPath.pop();
				continue;
			}
		}
		if (
			line.toLowerCase().startsWith("type") &&
			!hasAlreadyDefinedApiMethodType &&
			!withinApiMethodType
		) {
			withinApiMethodType = true;
			// Will grab the name of the API method function name from:
			// type createOrganization = {
			//      ^^^^^^^^^^^^^^^^^^
			functionName = line.replace("type ", "").split("=")[0].trim();
			continue;
		}

		if (!withinApiMethodType) {
			if (!hasAlreadyDefinedApiMethodType) {
				code_prefix += `${originalLine}\n`;
			} else {
				code_suffix += `\n${originalLine}`;
			}
			continue;
		}

		if (
			line.startsWith("/*") ||
			line.startsWith("*") ||
			line.startsWith("*/")
		) {
			if (line.startsWith("/*")) {
			} else if (line.startsWith("*/")) {
			} else {
				if (line === "*" || line === "* ") continue;
				line = line.replace("* ", "");

				const trimmed = line.trim();

				if (trimmed === "@serverOnly") {
					isServerOnly_ = true;
					continue;
				} else if (trimmed === "@nullable") {
					isNullable = true;
					continue;
				} else if (trimmed === "@clientOnly") {
					isClientOnly_ = true;
					continue;
				} else if (trimmed === "@deprecated") {
					jsDocDeprecated = true;
					continue;
				} else if (trimmed.startsWith("@link")) {
					jsDocLink = trimmed.replace("@link", "").trim() || null;
					continue;
				} else if (trimmed.startsWith("@params")) {
					const paramsString = trimmed.replace("@params", "").trim() || "{}";
					try {
						jsDocParams = JSON.parse(paramsString);
					} catch {
						jsDocParams = {};
					}
					continue;
				} else if (trimmed.startsWith("@returns")) {
					jsDocReturns = trimmed.replace("@returns", "").trim() || null;
					continue;
				} else if (trimmed.startsWith("@default")) {
					jsDocDefaultValue = trimmed.replace("@default", "").trim() || null;
					continue;
				} else if (trimmed === "@ignore") {
					jsDocIgnore = true;
					continue;
				}

				currentJSDocDescription += `${line} `;
			}
		} else {
			// New property field
			// Example:
			// name: string = "My Organization",

			let propName = line.split(":")[0].trim();
			const isOptional = !!propName.endsWith("?");
			if (isOptional) propName = propName.slice(0, -1); // Remove `?` in propname.

			const [beforeComment, inlineComment] = line.split("//");

			let propType =
				beforeComment
					.replace(propName, "")
					.replace("?", "")
					.replace(":", "")
					.split("=")[0]
					.trim() || "";

			let isTheStartOfNest = false;
			if (propType === "{") {
				// This means that it's a nested object.
				propType = `Object`;
				isTheStartOfNest = true;
				nestPath.push(propName);
				if (isServerOnly_) {
					serverOnlyPaths.push(nestPath.join("."));
				}
				if (isClientOnly_) {
					clientOnlyPaths.push(nestPath.join("."));
				}
			}

			if (clientOnlyPaths.includes(nestPath.join("."))) {
				isClientOnly_ = true;
			}

			if (serverOnlyPaths.includes(nestPath.join("."))) {
				isServerOnly_ = true;
			}

			let exampleValue = !beforeComment.includes("=")
				? null
				: beforeComment
						.replace(propName, "")
						.replace("?", "")
						.replace(":", "")
						.replace(propType, "")
						.replace("=", "")
						.trim();

			if (exampleValue?.endsWith(",")) exampleValue = exampleValue.slice(0, -1);

			const comments = inlineComment?.trim() ?? null;

			const description =
				currentJSDocDescription.length > 0 ? currentJSDocDescription : null;
			if (description) {
				currentJSDocDescription = "";
			}

			const defaultValue = jsDocDefaultValue;
			if (defaultValue) {
				jsDocDefaultValue = null;
			}

			const deprecated = jsDocDeprecated;
			if (deprecated) {
				jsDocDeprecated = false;
			}
			const link = jsDocLink;
			if (link) {
				jsDocLink = null;
			}
			const params = jsDocParams;
			if (params) {
				jsDocParams = undefined;
			}
			const returns = jsDocReturns;
			if (returns) {
				jsDocReturns = null;
			}

			const ignore = jsDocIgnore;
			if (ignore) {
				jsDocIgnore = false;
			}

			const property: Property = {
				...placeholderProperty,
				description,
				defaultValue,
				comments,
				exampleValue,
				isOptional,
				propName,
				type: propType,
				isServerOnly: isServerOnly_,
				isClientOnly: isClientOnly_,
				path: isTheStartOfNest
					? nestPath.slice(0, nestPath.length - 1)
					: nestPath.slice(),
				isNullable: isNullable,
				deprecated,
				link,
				params,
				returns,
				ignore,
			};

			isServerOnly_ = false;
			isClientOnly_ = false;
			isNullable = false;
			props.push(property);
		}
	}

	return {
		functionName,
		props,
		code_prefix,
		code_suffix,
	};
}

/**
 * Builds a property line with proper formatting and comments
 */
function buildPropertyLine(
	prop: Property,
	indentLevel: number,
	additionalComments: string[] = [],
): string {
	const comments: string[] = [...additionalComments];
	if (!prop.isOptional) comments.push("Required");
	if (prop.comments) comments.push(prop.comments);
	const addComment = comments.length > 0;

	const indent = indentationSpace.repeat(indentLevel);
	const propValue = prop.exampleValue ? `: ${prop.exampleValue}` : "";
	const commentText = addComment ? ` // ${comments.join(", ")}` : "";

	if (prop.type === "Object") {
		// For object types, put comment after the opening brace
		return `${indent}${prop.propName}${propValue}: {${commentText}\n`;
	} else {
		// For non-object types, put comment after the comma
		return `${indent}${prop.propName}${propValue},${commentText}\n`;
	}
}

function buildFetchOptionsParams(params?: string | string[]) {
	if (!params) return "";

	const list = Array.isArray(params) ? params : [params];

	return `{\n        params: { ${list.join(", ")} }\n    }`;
}

/**
 * Determines if the client request should use query parameters
 *
 * - GET requests use query params by default, unless `forceAsBody` is true
 * - Any request can be forced to use query params with `forceAsQuery`
 */
function shouldClientUseQueryParams(
	method: string | undefined,
	forceAsBody: boolean | undefined,
	forceAsQuery: boolean | undefined,
	forceAsParam: boolean | undefined,
): boolean {
	if (forceAsQuery) return true;
	if (forceAsBody) return false;
	if (forceAsParam) return false;
	return method === "GET";
}

function createClientBody({
	props,
	method,
	forceAsBody,
	forceAsQuery,
	forceAsParam,
	fetchOptionsParams,
}: {
	props: Property[];
	method?: string;
	forceAsBody?: boolean;
	forceAsQuery?: boolean;
	forceAsParam?: boolean;
	fetchOptionsParams?: string[] | string;
}) {
	const isQueryParam = shouldClientUseQueryParams(
		method,
		forceAsBody,
		forceAsQuery,
		forceAsParam,
	);
	const baseIndentLevel = isQueryParam ? 2 : 1;

	let params = ``;

	let i = -1;
	for (const prop of props) {
		i++;
		if (prop.isServerOnly) continue;
		if (prop.ignore) continue;
		if (params === "") params += "{\n";

		params += buildPropertyLine(prop, prop.path.length + baseIndentLevel);

		if ((props[i + 1]?.path?.length || 0) < prop.path.length) {
			const diff = prop.path.length - (props[i + 1]?.path?.length || 0);

			for (const index of Array(diff)
				.fill(0)
				.map((_, i) => i)
				.reverse()) {
				params += `${indentationSpace.repeat(index + baseIndentLevel)}},\n`;
			}
		}
	}

	if (params !== "") {
		if (isQueryParam) {
			// Wrap in query object for GET requests and when forceAsQuery is true
			params = `{\n    query: ${params}    },\n}`;
		} else {
			params += "}";
		}
	}

	const fetchOptions = buildFetchOptionsParams(fetchOptionsParams);

	if (params !== "" && fetchOptions) {
		params = params.replace(/\n}$/, `\n    fetchOptions: ${fetchOptions}\n}`);
	}

	return params;
}

function buildParamsBlock(params?: string | string[]) {
	if (!params) return "";

	const list = Array.isArray(params) ? params : [params];

	return `\n    params: { ${list.join(", ")} },`;
}

/**
 * Determines if the server request should use query parameters
 *
 * - GET requests use query params by default, unless `forceAsBody` is true
 * - Other methods (POST, PUT, DELETE) use body by default, unless `forceAsQuery` is true
 */
function shouldServerUseQueryParams(
	method: string,
	forceAsBody: boolean | undefined,
	forceAsQuery: boolean | undefined,
	forceAsParam: boolean | undefined,
): boolean {
	if (forceAsQuery) return true;
	if (forceAsBody) return false;
	if (forceAsParam) return false;
	return method === "GET";
}

function createServerBody({
	props,
	requireSession,
	optionalSession,
	requireBearerToken,
	method,
	forceAsBody,
	forceAsParam,
	forceAsQuery,
	fetchOptionsParams,
}: {
	props: Property[];
	requireSession: boolean;
	optionalSession: boolean;
	requireBearerToken: boolean;
	method: string;
	forceAsQuery: boolean | undefined;
	forceAsParam: boolean | undefined;
	forceAsBody: boolean | undefined;
	fetchOptionsParams?: string[] | string;
}) {
	const isQueryParam = shouldServerUseQueryParams(
		method,
		forceAsBody,
		forceAsQuery,
		forceAsParam,
	);
	const clientOnlyProps = props.filter((x) => !x.isClientOnly && !x.ignore);

	// Build properties content
	let propertiesContent = ``;
	let i = -1;

	for (const prop of props) {
		i++;
		if (prop.isClientOnly) continue;
		if (prop.ignore) continue;
		if (propertiesContent === "") propertiesContent += "{\n";

		// Check if this is a server-only nested property
		const isNestedServerOnlyProp =
			prop.isServerOnly &&
			!(
				prop.path.length &&
				props.find(
					(x) =>
						x.path.join(".") ===
							prop.path.slice(0, prop.path.length - 2).join(".") &&
						x.propName === prop.path[prop.path.length - 1],
				)
			);

		const additionalComments: string[] = [];
		if (isNestedServerOnlyProp) additionalComments.push("server-only");

		propertiesContent += buildPropertyLine(
			prop,
			prop.path.length + 2,
			additionalComments,
		);

		if ((props[i + 1]?.path?.length || 0) < prop.path.length) {
			const diff = prop.path.length - (props[i + 1]?.path?.length || 0);

			for (const index of Array(diff)
				.fill(0)
				.map((_, i) => i)
				.reverse()) {
				propertiesContent += `${indentationSpace.repeat(index + 2)}},\n`;
			}
		}
	}

	if (propertiesContent !== "") propertiesContent += "    },";

	// Build fetch options
	let fetchOptions = "";
	if (requireSession) {
		fetchOptions +=
			"\n    // This endpoint requires session cookies.\n    headers: await headers(),";
	}

	if (optionalSession) {
		fetchOptions +=
			"\n    // This endpoint accepts session cookies (optional).\n    headers: await headers(),";
	}
	if (requireBearerToken) {
		fetchOptions +=
			"\n    // This endpoint requires a bearer authentication token.\n    headers: { authorization: 'Bearer <token>' },";
	}

	const extraParamsBlock = buildParamsBlock(fetchOptionsParams);

	// Assemble final result
	let result = "";
	if (clientOnlyProps.length > 0) {
		result += "{\n";
		const paramType = isQueryParam ? "query" : forceAsParam ? "params" : "body";
		result += `    ${paramType}: ${propertiesContent}${extraParamsBlock}${fetchOptions}\n}`;
	} else if (fetchOptions.length) {
		result += `{${fetchOptions}\n}`;
	}

	return result;
}

function Note({ children }: { children: ReactNode }) {
	return (
		<Callout type="info" className="my-0 py-2 rounded-none border-y-0">
			{children}
		</Callout>
	);
}
