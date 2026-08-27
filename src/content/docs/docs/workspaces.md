---
title: Dart workspaces
description: Analyze a Dart workspace package by package with bounded configuration discovery and workspace-relative findings.
sidebar:
  label: Workspaces / monorepos
---

:::note[Available in v1.2.0]
Package-scoped Dart workspace analysis is included in Hyena Dart 1.2.0 and later.
:::

Hyena switches to workspace analysis when the **target root's** `pubspec.yaml` declares `workspace`. It analyzes the root package and every discovered member independently, while keeping report paths relative to the common workspace root.

## Declare the workspace

A root can list package directories explicitly and with globs:

```yaml title="pubspec.yaml"
name: company_workspace
environment:
  sdk: ^3.10.0

workspace:
  - apps/mobile
  - packages/*
  - tools/codegen
```

Every non-root member must opt into Dart workspace resolution:

```yaml title="packages/auth/pubspec.yaml"
name: company_auth
resolution: workspace
environment:
  sdk: ^3.10.0
```

Hyena supports explicit entries, nested workspace declarations, and glob entries. The accepted workspace syntax is ultimately determined by the installed Dart SDK, so use syntax that `dart pub get` accepts for the target project.

:::note[Native Windows paths in v1.2.1]
Hyena Dart 1.2.1 and later accept native separators in both explicit and glob entries. On Windows, plain YAML values can therefore use backslashes:

```yaml title="pubspec.yaml (Windows)"
workspace:
  - apps\mobile
  - packages\*
```

Forward-slash entries continue to work. The same validation, root boundary, and `resolution: workspace` requirements apply after either form is expanded.
:::

A discovered member can declare another workspace to add nested members:

```yaml title="packages/platform/pubspec.yaml"
name: company_platform
resolution: workspace
environment:
  sdk: ^3.10.0

workspace:
  - plugins/*
```

Resolve the complete workspace before analysis:

```shell
dart pub get
hyena_dart analyze .
```

Point the command at the directory that owns the root `workspace:` declaration. A package directory without that root declaration is analyzed as a single package.

## Package boundaries

Hyena builds one analysis result per package, including the root package. Descendant member directories are excluded from every ancestor scan. A source file is therefore analyzed once, under the nearest package boundary and that package's configuration.

Workspace discovery rejects ambiguous or unsafe membership, including:

- a missing member;
- the same member listed more than once;
- duplicate package names;
- a member outside the target root;
- a resolved member symlink that escapes the target root; and
- a non-root member without `resolution: workspace`.

Fix the workspace declaration rather than excluding an invalid member from Hyena. The same package graph should be valid for both Dart and the analyzer.

## Cross-package dead-code reachability

:::note[Correctly joined in v1.2.1]
Hyena Dart 1.2.1 and later join resolved dead-code edges across workspace package boundaries before traversing the graph.
:::

A root in an app package can therefore keep the exact declaration it reaches in a shared package, along with that declaration's reachable dependencies. Package-scoped reports are preserved: a live shared declaration remains in its package's result rather than moving into the caller's result.

Matching uses resolved declaration identity, not just a name. If two packages both declare `SessionStore`, a reference to one does not keep the other alive. References made only from an unreachable caller also do not make their targets reachable, including when caller and target are in different packages.

This joined graph applies to dead-code analysis. Complexity remains calculated and reported independently for each package.

## Configuration per package

Without `--config`, Hyena discovers configuration separately for each package:

1. start at the package directory;
2. prefer `hyena.yaml` over `analysis_options.yaml` in the same directory;
3. walk upward to the nearest configuration; and
4. stop at the workspace root.

A member can therefore override the root policy with its own configuration, while packages without a local file inherit the nearest parent configuration inside the workspace.

An explicit configuration is intentionally different:

```shell
hyena_dart analyze . --config=tool/hyena-strict.yaml
```

The selected file applies to **every** package in the workspace. It may be outside the workspace root because the user, rather than automatic discovery, supplied the path. Review that file before using it; there is no per-member fallback when `--config` is explicit.

See [Configuration](/docs/configuration/) for the complete schema.

## Package-scoped reports

The presentation preserves package boundaries:

| Format | Workspace behavior |
| --- | --- |
| Console | Prints a separate analysis section for each package. |
| JSON | Adds `workspace.packageCount` and a `packages` array of package results. |
| Markdown | Groups summaries and findings by package. |
| HTML | Renders package-scoped report sections in the standalone document. |
| SARIF | Keeps source locations relative to the common workspace root. |

Baseline fingerprints also use workspace-relative paths, so matching remains stable across package sections without leaking absolute member locations.

## MCP workspace results

With workspace support in v1.2.0, `hyena_mcp --root <workspace-root>` accepts a relative target such as `.` and aggregates every workspace package. Returned finding paths remain relative to the configured workspace root.

The MCP server's existing file, byte, finding, time, and concurrency limits still apply to the complete request. Workspace support does not broaden the configured root or create a second tool. See [Safe AI and MCP](/docs/safe-ai-mcp/) for the read-only contract and trust boundary.
