---
title: Report formats
description: Choose console, JSON, Markdown, HTML, or SARIF output and understand each report's shape.
---

All commands build an `AnalysisResult` and pass it to one reporter. Select a format with `--format` and write it with `--output`.

```shell
dart run hyena_dart analyze lib --format=json --output=hyena-report.json
```

Without `--output`, the generated content is printed to stdout.

When `--baseline` is present, matched dead-code entries are removed and matched complexity rules are suppressed before reporting. Violation lists omit suppressed rules; JSON retains complexity metrics and identifies suppressed rules in `suppressedRules`.

## Path basis

Console, JSON, Markdown, HTML, SARIF, and baseline paths are relative to the package root, or to the common workspace root for workspace analysis. Without a `pubspec.yaml` ancestor, they use the target directory or a file target's parent. MCP paths are relative to its configured `--root`.

- `dart run hyena_dart analyze lib` reports `lib/src/cache.dart`.
- An analysis of the single file `lib/src/cache.dart` still reports `lib/src/cache.dart`.
- A workspace member reports a path such as `packages/cache/lib/src/cache.dart`.

In v2, this makes console, JSON, Markdown, and HTML portable across checkout locations. JSON `targetPath` and every `filePath` use the same project- or workspace-relative basis. Baseline fingerprints, SARIF locations, and MCP finding paths were already relative in v1.x and remain compatible.

## Console

The default reporter is intended for interactive runs. It prints target and duration, then one section per included analyzer.

- Dead-code findings are grouped by entity type and limited to the first 20 in each group.
- Complexity output shows up to 20 threshold violations.
- Reported skips are listed with their reasons in the dead-code and complexity sections.
- `--no-color` removes ANSI styling.

Use another format when truncation is undesirable.

## JSON

JSON is the stable choice for scripts and CI. A combined report has this shape:

```json
{
  "targetPath": "lib",
  "duration": "205ms",
  "deadCode": {
    "analyzedAt": "2026-08-27T08:00:00.000000",
    "summary": {
      "totalDeclarations": 170,
      "unusedCount": 1,
      "deadCodePercentage": "0.59"
    },
    "unusedEntities": [
      {
        "name": "Cache._legacyKey",
        "type": "field",
        "filePath": "lib/src/cache.dart",
        "line": 42,
        "column": 9,
        "isPublic": false
      }
    ],
    "skippedFiles": []
  },
  "complexity": {
    "analyzedAt": "2026-08-27T08:00:00.100000",
    "thresholds": {
      "cyclomaticComplexity": 20,
      "maxNestingLevel": 5,
      "maxParameters": 6
    },
    "summary": {
      "totalFiles": 1,
      "totalFunctions": 1,
      "totalLines": 120,
      "highComplexityFunctions": 1,
      "highNestingFunctions": 0,
      "highParameterFunctions": 0,
      "thresholdViolations": 1
    },
    "files": [
      {
        "filePath": "lib/src/cache.dart",
        "totalLines": 120,
        "codeLines": 94,
        "commentLines": 12,
        "blankLines": 14,
        "averageCyclomaticComplexity": "23.00",
        "maxCyclomaticComplexity": 23,
        "functions": [
          {
            "name": "Cache.refresh",
            "filePath": "lib/src/cache.dart",
            "line": 55,
            "cyclomaticComplexity": 23,
            "linesOfCode": 48,
            "maxNestingLevel": 4,
            "parameterCount": 2,
            "halsteadVolume": "492.34",
            "maintainabilityIndex": "41.38"
          }
        ]
      }
    ],
    "skippedFiles": [
      {
        "filePath": "lib/src/broken.dart",
        "reason": "<reason>"
      }
    ]
  }
}
```

Both the `deadCode` and `complexity` sections include a `skippedFiles` array of reported skips, each with a `filePath` and a single-line `reason`. Generated files that fail dead-code resolution are silently ignored and absent from these arrays. Missing references can cause dead-code findings even with an empty array; see [Analysis flow](/docs/analysis/dead-code/#analysis-flow). Markdown, HTML, and SARIF reports do not currently include skipped files; use console or JSON output, or the CLI's `Warning: skipped` lines on stderr.

Numeric-looking percentages, durations, averages, Halstead volume, and maintainability values are encoded as strings. Counts and thresholds are integers.

When a command runs only one analyzer, the other top-level key is absent rather than `null`.

## Markdown

Markdown is suited to pull-request comments, issue attachments, and checked-in snapshots.

- Dead-code sections contain complete tables grouped by entity type.
- Complexity sections include summary counts and, when unsuppressed threshold violations remain, every violation and collapsible summaries for all analyzed files.

```shell
dart run hyena_dart dead-code lib -f markdown -o dead-code.md
```

## HTML

HTML creates a self-contained document with embedded styles and no external assets. It includes summary cards, grouped dead-code tables, and a complexity violation table.

```shell
dart run hyena_dart analyze lib -f html -o report.html
```

The HTML reporter lists all findings it receives. Keep reports private when source paths or declaration names are sensitive.

## Workspace reports

:::note[Available in v1.2.0]
Package-scoped Dart workspace reporting is included in Hyena Dart 1.2.0 and later.
:::

For a target root that declares `workspace`, console, JSON, Markdown, and HTML preserve a separate result section for the root package and each member. Workspace JSON adds `workspace.packageCount` and a `packages` array. Every package section still uses paths relative to the common workspace root.

SARIF locations and baseline fingerprint paths also use the common workspace root. MCP finding paths use its configured `--root`. See [Workspaces and monorepos](/docs/workspaces/#package-scoped-reports) for boundary and configuration behavior.

## SARIF

SARIF 2.1 is intended for code-scanning systems and editor integrations. Hyena emits rules for dead code and each complexity threshold, physical source locations, finding properties, and stable partial fingerprints.

```shell
dart run hyena_dart analyze . --format=sarif --output=hyena.sarif
```

The output is one SARIF run whose driver name is `Hyena Dart`. Locations are project-relative for a package and workspace-relative for a workspace. Use `--baseline` to omit accepted findings before uploading the file.

## Programmatic reporters

All built-in reporters implement:

```dart
abstract class Reporter {
  Future<String> generate(AnalysisResult result);
}
```

See [Library API](/docs/library-api/#generate-output) for direct use and custom reporter guidance.
