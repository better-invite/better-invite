<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/better-invite/better-invite/refs/heads/main/assets/banner-dark.png" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/better-invite/better-invite/refs/heads/main/assets/banner.png" />
  <img alt="Better Invite Logo" src="https://raw.githubusercontent.com/better-invite/better-invite/refs/heads/main/assets/banner.png" />
</picture>

<h1 align="center">
  Better Invite
</h1>

<p align="center">
  A plugin for <a href="https://www.better-auth.com">Better Auth</a> that adds an invitation system, allowing you to create, send, and manage invites for user sign-ups or role upgrades.
  <br />
  <a href="https://www.better-invite.com"><strong>Learn More »</strong></a>
</p>

<p align="center">
  <a href="https://choosealicense.com/licenses/mit/">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript&logoColor=white" />
  </a>
  <a href="https://www.npmjs.com/package/better-invite/">
    <img src="https://img.shields.io/npm/v/better-invite?logo=npm" />
  </a>
  <a href="https://www.npmjs.com/package/better-invite/">
    <img src="https://img.shields.io/npm/dm/better-invite?logo=npm&label=Downloads&labelColor=gray&color=red" />
  </a>
  <a href="https://www.better-auth.com/docs/concepts/plugins/">
    <img src="https://img.shields.io/badge/Better_Auth-Plugin-blue?logo=better-auth" />
  </a>
  <a href="https://github.com/better-invite/better-invite/actions/workflows/ci.yml">
    <img src="https://github.com/better-invite/better-invite/actions/workflows/ci.yml/badge.svg?branch=main" />
  </a>
</p>

## Features

- 👤 Keep track of who created and who accepted the invite.
- 🧾 Create and manage invitation codes to control user sign-ups.
- 📩 Send invitations via email, provide a shareable URL, or generate an invitation code.
- 🛡️ Automatically assign or upgrade roles when invites are used.
- 📊 Track each invitation's usage and enforce maximum uses.
- 🧩 Support multiple token types, including default, code, or custom tokens.
- 🍪 Store tokens securely in browser cookies for seamless activation.
- ⚙️ Fully customize behavior for redirects, token expiration, and email handling.
- 🔒 Built with security in mind to prevent unauthorized invite usage.
- 🎉 Show the invitee a welcome page or role upgrade page after signing up or upgrading their role.

---

<div align="center">
  <p>Please consider sponsoring us</p>
  
  <a href="https://patreon.better-invite.com/membership">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/better-invite/.github/refs/heads/main/profile/sponsor-us-dark.svg" />
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/better-invite/.github/refs/heads/main/profile/sponsor-us.svg" />
      <img alt="Sponsor us :)" src="https://raw.githubusercontent.com/better-invite/.github/refs/heads/main/profile/sponsor-us.svg" />
    </picture>
  </a>
</div>

---

## Installation

Install the plugin

```bash
npm install better-invite
# or
pnpm add better-invite
# or
yarn add better-invite
# or
bun add better-invite
```

---

## Server-Side Setup

Start by importing `invite` in your `betterAuth` configuration.

```ts
import { invite } from "better-invite";

export const auth = betterAuth({
    //... other options
    plugins: {
        adminPlugin({
            ac,
            roles: { user, admin },
            defaultRole: "user",
        }),
        invite({
            async sendUserInvitation({ email, role, url }) {
                void sendInvitationEmail(role as RoleType, email, url);
            },
        })
    },
    emailAndPassword: {
        enabled: true
    }
});
```

---

## Client-Side Setup

Import the `inviteClient` plugin and add it to your `betterAuth` configuration.

```ts
import { inviteClient } from "better-invite";

const client = createClient({
    //... other options
    plugins: [
        inviteClient()
    ],
});
```

---

## Usage/Examples

### Creating Invites
Authenticated users can create invite codes. You can create a invite on the client or on the server.
Invites can be public or private:

## Public Invites

```ts
const { data } = await authClient.invite.create({
  // Here you put the options
  role: "admin",
  // The invite is private, because no email is passed when creating the invite
  senderResponse: "token" // Will receive the invite token
  redirectToAfterUpgrade: "/auth/invited"
});

if (data) {
  // Example response: { status: true, message: "token" }
  // You can use the token to manually share the invite
  console.log("Invite token:", data.message);
}
```

## Private Invites

```ts
await authClient.invite.create({
  // Here you put the options
  role: "admin",
  // The invite is private, because an email is passed when creating the invite
  email: ["test@email.com"], // A list of users the invite works on (also a list of the users to send an invite email to)
  redirectToAfterUpgrade: "/auth/invited"
});
```

### Accepting Invites

When a user receives an invite code, they can accept it, and only private invitees can reject an invite.
If the user receives an email, the link they receive **automatically accepts the invite**.

But you can also activate an invite manually using the API.
This is useful for making a custom UI with accept and reject buttons

```ts
await client.invite.accept({
  token,
  callbackUrl // The user gets redirected here after accepting the invite
});
```

### Rejecting Invites

Rejecting an invite marks it as rejected. For private invites with multiple email addresses, only the rejected email is removed from the invite's email list.
When `cleanupInvitesOnDecision` is enabled, the invite and all associated uses are deleted.

```ts
await client.invite.reject({
  token,
  callbackUrl // The user gets redirected here after rejecting the invite
});
```

**Read the [documentation](https://www.better-invite.com/docs/introduction) to learn more.**

## Acknowledgements

 - Inspired in the [invite system](https://github.com/bard/better-auth-invite) from Max.

---

> This project is not associated with Better Auth
