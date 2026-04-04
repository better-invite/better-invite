import type { Where } from "better-auth/adapters";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import * as z from "zod";
import { getInviteAdapter } from "../adapter";
import type { NewInviteOptions } from "../types";

export const listInvites = (options: NewInviteOptions) => {
	return createAuthEndpoint(
		"/invite/list",
		{
			method: "GET",
			use: [sessionMiddleware],
			query: z.object({
				searchValue: z
					.string()
					.meta({
						description: "The value to search for",
					})
					.optional(),
				searchField: z
					.enum(["name", "email", "domainWhitelist"])
					.meta({
						description:
							"The field to search in, defaults to email. Can be `email`, `name` or `domainWhitelist`",
					})
					.optional(),
				searchOperator: z
					.enum(["contains", "starts_with", "ends_with"])
					.meta({
						description:
							"The operator to use for the search. Can be `contains`, `starts_with` or `ends_with`",
					})
					.optional(),
				limit: z.coerce
					.number()
					.int()
					.meta({
						description: "The numbers of invitations to return",
					})
					.optional(),
				offset: z.coerce
					.number()
					.int()
					.meta({
						description: "The offset to start from",
					})
					.optional(),
				sortBy: z
					.string()
					.meta({
						description: "The field to sort by",
					})
					.optional(),
				sortDirection: z
					.enum(["asc", "desc"])
					.meta({
						description: "The direction to sort by",
					})
					.optional(),
				filterField: z
					.string()
					.meta({
						description: "The field to filter by",
					})
					.optional(),
				filterValue: z
					.string()
					.or(z.number())
					.or(z.boolean())
					.meta({
						description: "The value to filter by",
					})
					.optional(),
				filterOperator: z
					.enum(["eq", "ne", "lt", "lte", "gt", "gte"])
					.meta({
						description: "The operator to use for the filter",
					})
					.optional(),
			}),
			metadata: {
				openapi: {
					operationId: "listInvites",
					description: "List all (private) invitations for the current user.",
					responses: {
						200: {
							description: "List of all issued invitations",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											invitations: {
												type: "array",
												items: {
													$ref: "#/components/schemas/InviteType",
												},
											},
											total: {
												type: "number",
											},
											limit: {
												type: ["number", "undefined"],
											},
											offset: {
												type: ["number", "undefined"],
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
		async (ctx) => {
			const where: Where[] = [
				{
					field: "createdByUserId",
					value: ctx.context.session.user.id,
				},
			];

			if (ctx.query?.searchValue) {
				where.push({
					field:
						// Replace `email` with `emails` if searchField is `email`, to search in the emails array field
						ctx.query.searchField === "email"
							? "emails"
							: (ctx.query.searchField ?? "emails"),
					operator: ctx.query.searchOperator || "contains",
					value: ctx.query.searchValue,
				});
			}

			if (
				ctx.query?.filterValue &&
				ctx.query.filterField !== "createdByUserId"
			) {
				where.push({
					field: ctx.query.filterField || "email",
					operator: ctx.query.filterOperator || "eq",
					value: ctx.query.filterValue,
				});
			}

			const adapter = getInviteAdapter(ctx.context, options);

			try {
				const limit = Number(ctx.query?.limit) || undefined;
				const offset = Number(ctx.query?.offset) || undefined;

				const total = await adapter.countInvitations({ where });

				let invitations = await adapter.listInvitations({
					where,
					limit: ctx.query.limit,
					offset: ctx.query.offset,
					sortBy: ctx.query.sortBy
						? {
								field: ctx.query.sortBy,
								direction: ctx.query.sortDirection || "asc",
							}
						: undefined,
				});

				const expiredInvitations = invitations.filter(
					({ expiresAt }) => !!expiresAt && expiresAt < new Date(),
				);
				const expiredIds = new Set(expiredInvitations.map(({ id }) => id));
				if (expiredIds.size > 0) {
					invitations = invitations.map((i) => {
						if (!expiredIds.has(i.id)) {
							return i;
						}
						return {
							...i,
							status: "expired",
						};
					});
				}

				return ctx.json({
					total,
					invitations,
					limit,
					offset,
				});
			} catch {
				return ctx.json({
					total: 0,
					invitations: [],
				});
			}
		},
	);
};
