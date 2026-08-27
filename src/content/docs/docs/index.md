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
| Look up a command or flag | [CLI reference](/docs/cli-reference/) |
| Exclude files or change thresholds | [Configuration](/docs/configuration/) |
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
    ignore_exports: true
    ignore_private: false
```

Hyena also excludes `*.g.dart`, `*.freezed.dart`, `*.mocks.dart`, and any path containing a directory segment named `generated`, even when they are not listed in `exclude`.

:::note[Version scope]
These docs cover Hyena Dart 1.1.2. Features from the current `main` branch that are not yet published are explicitly marked as unreleased.
:::

## Source and package

- [Source repository](https://github.com/Chandram-Dutta/hyena_dart)
- [Package on pub.dev](https://pub.dev/packages/hyena_dart)
- [Issue tracker](https://github.com/Chandram-Dutta/hyena_dart/issues)
