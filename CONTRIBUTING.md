# Contributing

We really appreciate your interest in contributing to Better Invite. This guide will help you get started. Before you begin, please take a moment to review the following guidelines.

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Repository Setup

1. Fork the repository and clone it locally:

   ```bash
   git clone https://github.com/your-username/better-invite.git
   cd better-invite
   ```

### Prerequisites

- Node.js >= 24 (LTS)
- npm >= 10

2. Install Node.js (LTS version recommended)

   > **Note**: This project is configured to use
   > [nvm](https://github.com/nvm-sh/nvm) to manage the local Node.js version,
   > as such this is the simplest way to get you up and running.

   Once installed, use:

   ```bash
   nvm install
   nvm use
   ```

   Alternatively, see
   [Node.js installation](https://nodejs.org/en/download) for other supported
   methods.

3. Install [pnpm](https://pnpm.io/)

   > **Note:** This project is configured to manage [pnpm](https://pnpm.io/) via
   > [corepack](https://github.com/nodejs/corepack).
   > Once installed, upon usage you’ll be prompted to install the correct pnpm
   > version

   Alternatively, use `npm` to install it:

   ```bash
   npm install -g pnpm
   ```

4. Install project dependencies:

   ```bash
   pnpm install
   ```

5. Build the project:

   ```bash
   pnpm build
   ```

## Testing

Bug fixes and new features must include tests.

Run the full test suite:

```bash
pnpm test
```

## Documentation

The documentation site can be found in `docs/` and content is organized under `docs/content/docs/` by topic.

To run the docs locally:

```bash
pnpm -F docs dev
```

## Issue Guidelines

Before opening an issue, search existing issues to avoid duplicates.
We provide templates to help you get started.

### Bug Reports

Use the [bug report template](https://github.com/better-auth/better-auth/issues/new?template=bug_report.yml).
Provide a clear description of the bug with steps to reproduce and a minimal
reproduction.

### Feature Requests

New features start with discussion. Open a [feature request](https://github.com/better-invite/better-invite/discussions/new?category=feature-request) describing the problem, your proposed solution, and how it would benefit the project. This gives us room to align on scope and API shape before anyone writes code.

### Security Reports

Do not open a public issue for security vulnerabilities.
Email [security@better-invite.com](mailto:security@better-invite.com) instead.
See [SECURITY.md](/SECURITY.md) for details.

## Pull Request Guidelines

> [!NOTE]
> For new features, please open an issue first to discuss before moving forward. We do not review large feature PRs opened without going through an issue first.

### Code Formatting and Linting

[Lefthook](https://lefthook.dev/) runs linting, formatting, and spell checking
in parallel on every commit. Additional checks like dependency linting (knip),
type checking, and tests run in CI.

To skip a specific hook by command name, use `LEFTHOOK_EXCLUDE`:

```bash
LEFTHOOK_EXCLUDE=spell git commit -m "your message"
```

Run `pnpm typecheck` and make sure it passes before opening your PR.

### Branch Targeting

- **`main` is the stable track.** It ships bug fixes, security work, additive
  improvements, and behavior changes that do not require user action. New
  capabilities can land here too as long as they are well-tested, non-breaking,
  and safe to adopt immediately.
- **`beta` is the beta track.** It ships new features, refactors, and breaking
  changes.

### Submitting a PR

1. Open a pull request against the **`main`** branch.

2. PR titles must follow the [Conventional Commits](https://www.conventionalcommits.org/)
   format, with an optional scope for the affected package or feature:

   ```
   `feat(scope): description` or
   `fix(scope): description` or
   `perf: description` or
   `docs: description` or
   `chore: description` etc.
   ```

   - The subject must start with a lowercase letter.
   - Use `docs` when changes are confined to `docs/`.
   - Append `!` for breaking changes (e.g. `feat(scope)!: description`). These go through `next`, not `main`.

3. In your PR description:
   - Clearly describe what you changed and why
   - Reference related issues (e.g. "Closes #1234")
   - List any potential breaking changes
   - Add screenshots for UI changes

## Project Structure

```text
.github
  └─ workflows
        └─ GitHub Actions CI configuration files
.vscode
  └─ Recommended VSCode settings for contributors
package
  ├─ src
  │   ├─ routes
  │   │     └─ API route handlers for the plugin
  │   ├─ Database adapter implementation
  │   ├─ Plugin hooks and lifecycle logic
  │   └─ Type definitions for the plugin
  └─ tests
      └─ Test suite covering plugin functionality
docs
  └─ Documentation site (built with Next.js)
demo
  └─ Demo application (built with Next.js)
```