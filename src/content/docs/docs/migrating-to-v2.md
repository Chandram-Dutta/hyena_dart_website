---
title: Migrating to v2.0
description: Move a Hyena Dart v1.x setup to project-local execution, review the new dead-code default, and update report-path consumers.
sidebar:
  label: Migrate to v2.0
---

:::note[Current release]
Hyena Dart v2.0.0 is available on [pub.dev](https://pub.dev/packages/hyena_dart) and as a [GitHub release](https://github.com/Chandram-Dutta/hyena_dart/releases/tag/v2.0.0).
:::

## Pin and run Hyena in each project

v2 removes support for global command mappings. Add Hyena as a development dependency of every project that runs it:

```shell title="Dart"
dart pub add dev:hyena_dart
```

```shell title="Flutter"
flutter pub add dev:hyena_dart
```

Replace direct CLI invocations with the project-local entry point:

```shell
dart run hyena_dart analyze .
dart run hyena_dart dead-code lib
dart run hyena_dart complexity lib
```

This resolves the dependency version selected by the project's lockfile. Update scripts, CI jobs, editor tasks, and shell aliases that previously depended on a global executable.

For MCP, run the package entry point from the project:

```shell
dart run hyena_dart:hyena_mcp \
  --root .
```

If the client starts outside the project, set the spawned process's working directory explicitly:

```json title="mcp.json"
{
  "command": "dart",
  "cwd": "/absolute/path/to/project",
  "args": [
    "run",
    "hyena_dart:hyena_mcp",
    "--root",
    "."
  ]
}
```

`cwd` selects the project whose lockfile resolves Hyena. `--root .` then confines accepted analysis targets and automatic configuration discovery to that project. Dart 3.10 does not accept a top-level `-C` option; use the MCP client's equivalent working-directory setting if it names the field differently. See [Safe AI and MCP](/docs/safe-ai-mcp/#configure-an-mcp-client) for the complete example.

## Review the larger default finding set

`hyena.dead_code.ignore_exports` changes from `true` to `false`. v2 therefore reports unused public declarations as well as unused private declarations by default.

Application projects should review the additional findings rather than hiding them broadly. Reusable package authors whose exported public API is intentionally consumed outside the scanned project can preserve that API as reachability roots:

```yaml title="hyena.yaml"
hyena:
  dead_code:
    ignore_exports: true
```

The equivalent one-run override is available on both combined and dead-code-only analysis:

```shell
dart run hyena_dart analyze . \
  --ignore-exports
dart run hyena_dart dead-code . \
  --ignore-exports
```

Both commands also accept `--ignore-private` when convention- or tool-driven private declarations should be retained.

## Update report-path consumers

Console, JSON, Markdown, and HTML now render every source and target path relative to the analyzed project root, or relative to the common workspace root for a Dart workspace.

Examples:

- `dart run hyena_dart analyze lib` reports `lib/src/cache.dart`, not a path relative to `lib` and not an absolute machine path;
- a single-file target reports `lib/src/cache.dart`; and
- a workspace member reports `packages/cache/lib/src/cache.dart`.

For JSON integrations, update assumptions around `targetPath` and every `filePath`. These values are now portable project- or workspace-relative strings. Console parsers and checked-in Markdown or HTML snapshots may also change even when the findings do not.

:::note[Existing baselines remain valid]
Baseline fingerprints, SARIF locations, and MCP finding paths were already relative in v1.x and keep the same path basis in v2. Existing baseline files remain compatible; do not regenerate a baseline solely for this upgrade.
:::

## Migration checklist

1. Add Hyena to each project's `dev_dependencies` and resolve dependencies.
2. Replace global command mappings in local scripts, CI, editors, and MCP configuration with the project-local commands above.
3. Run dead-code analysis and review newly reported public declarations.
4. Enable `ignore_exports` only for a deliberately preserved reusable public API.
5. Update consumers and golden files for relative console, JSON, Markdown, and HTML paths.
6. Keep the existing baseline unless the reviewed finding set itself changes.
