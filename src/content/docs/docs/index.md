---
title: Documentation
description: Choose the shortest path to installing, running, configuring, or extending Hyena Dart.
sidebar:
  label: Overview
---

Hyena is a Dart package and CLI for two related checks:

- **Dead code:** resolve declarations and references, build a reachability graph, and report declarations that have no path from a root.
- **Complexity:** parse functions, methods, constructors, and closures and calculate control-flow and size metrics.

It analyzes a Dart file or recursively scans a directory and can write console, JSON, Markdown, standalone HTML, or SARIF 2.1 output.

## Choose a path

| Goal | Start here |
| --- | --- |
| Run Hyena once | [Getting started](/docs/getting-started/) |
| Pick an installation model | [Installation](/docs/installation/) |
| Upgrade an existing v1.x project | [Migrate to v2.0](/docs/migrating-to-v2/) |
| Look up a command or flag | [CLI reference](/docs/cli-reference/) |
| Exclude files or change thresholds | [Configuration](/docs/configuration/) |
| Analyze a Dart workspace or monorepo | [Workspaces and monorepos](/docs/workspaces/) |
| Preserve framework or generated entry roots | [Framework entry roots](/docs/configuration/#framework-and-generated-code-entry-roots) |
| Understand a finding | [Dead-code analysis](/docs/analysis/dead-code/) or [complexity analysis](/docs/analysis/complexity/) |
| Consume or publish a report | [Report formats](/docs/reports/) |
| Use results in automation | [CI and automation](/docs/ci/) |
| Connect an AI client | [Safe AI and MCP](/docs/safe-ai-mcp/) |
| Call the analyzers from Dart | [Library API](/docs/library-api/) |
| Contribute to Hyena | [Architecture and development](/docs/architecture/) |

## Defaults at a glance

```yaml title="hyena.yaml"
hyena:
  exclude: []
  complexity:
    cyclomatic_threshold: 20
    max_nesting: 5
    max_parameters: 6
  dead_code:
    ignore_main: true
    ignore_exports: false
    ignore_private: false
    entry_points: []
    entry_point_annotations: []
```

Hyena also excludes `*.g.dart`, `*.freezed.dart`, `*.mocks.dart`, and any path containing a directory segment named `.dart_tool`, `build`, or `generated`, even when they are not listed in `exclude`.

:::note[Version scope]
These docs cover Hyena Dart v2.0.0, the current published release.
:::

## Available in v2.0.0

Hyena Dart v2.0.0 moves to [project-local installation and execution](/docs/installation/), reports unused public and private declarations by default, and makes console, JSON, Markdown, and HTML paths consistently relative to the package or workspace root.

Existing v1.x projects should read [Migrating from v1.x to v2.0](/docs/migrating-to-v2/) before upgrading. Existing baseline fingerprints remain valid; SARIF, baseline, and MCP paths were already relative in v1.x.

## Fixed in v1.2.1

Hyena Dart 1.2.1:

- [joins dead-code reachability across workspace package boundaries](/docs/workspaces/#cross-package-dead-code-reachability), preserving the exact resolved declaration while ignoring references that occur only inside unreachable callers; and
- accepts [native Windows separators in explicit and glob workspace entries](/docs/workspaces/#declare-the-workspace).

## Available in v1.2.0

Hyena Dart 1.2.0 adds:

- [CLI and MCP version output](/docs/cli-reference/#version-output), with release checks that keep runtime output aligned with the package version;
- [package-scoped Dart workspace analysis](/docs/workspaces/) with workspace-relative findings; and
- [configured declaration and annotation entry roots](/docs/configuration/#framework-and-generated-code-entry-roots) for framework- or generated-code reachability.

## Source and package

- [Source repository](https://github.com/Chandram-Dutta/hyena_dart)
- [Package on pub.dev](https://pub.dev/packages/hyena_dart)
- [v2.0.0 release notes](https://github.com/Chandram-Dutta/hyena_dart/releases/tag/v2.0.0)
- [v1.2.4 release notes](https://github.com/Chandram-Dutta/hyena_dart/releases/tag/v1.2.4)
- [v1.2.1 release notes](https://github.com/Chandram-Dutta/hyena_dart/releases/tag/v1.2.1)
- [v1.2.0 release notes](https://github.com/Chandram-Dutta/hyena_dart/releases/tag/v1.2.0)
- [Issue tracker](https://github.com/Chandram-Dutta/hyena_dart/issues)
