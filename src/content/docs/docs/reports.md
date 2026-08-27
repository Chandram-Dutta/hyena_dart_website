---
title: Report formats
description: Choose console, JSON, Markdown, HTML, or SARIF output and understand each report's shape.
---

All commands build an `AnalysisResult` and pass it to one reporter. Select a format with `--format` and write it with `--output`.

```shell
hyena_dart analyze lib --format=json --output=hyena-report.json
```

Without `--output`, the generated content is printed to stdout.

When `--baseline` is present, baseline-matched findings are removed before any reporter runs. Every format therefore shows only current, unsuppressed findings.

## Console

The default reporter is intended for interactive runs. It prints target and duration, then one section per included analyzer.

- Dead-code findings are grouped by entity type and limited to the first 20 in each group.
- Complexity output shows up to 20 threshold violations.
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
    ]
  },
  "complexity": {
    "analyzedAt": "2026-08-27T08:00:00.100000",
    "thresholds": {
      "cyclomaticComplexity": 20,
      "maxNestingLevel": 5,
      "maxParameters": 6
    },
    "summary": {
      "totalFiles": 17,
      "totalFunctions": 133,
      "totalLines": 2400,
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
        "averageCyclomaticComplexity": "4.25",
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
            "maintainabilityIndex": "43.18"
          }
        ]
      }
    ]
  }
}
```

Numeric-looking percentages, durations, averages, Halstead volume, and maintainability values are encoded as strings. Counts and thresholds are integers.

When a command runs only one analyzer, the other top-level key is absent rather than `null`.

## Markdown

Markdown is suited to pull-request comments, issue attachments, and checked-in snapshots.

- Dead-code sections contain complete tables grouped by entity type.
- Complexity sections include summary counts, every threshold violation, and collapsible summaries for all files.

```shell
hyena_dart dead-code lib -f markdown -o dead-code.md
```

## HTML

HTML creates a self-contained document with embedded styles and no external assets. It includes summary cards, grouped dead-code tables, and a complexity violation table.

```shell
hyena_dart analyze lib -f html -o report.html
```

The HTML reporter lists all findings it receives. Keep reports private when source paths or declaration names are sensitive.

## SARIF

SARIF 2.1 is intended for code-scanning systems and editor integrations. Hyena emits rules for dead code and each complexity threshold, physical source locations, finding properties, and stable partial fingerprints.

```shell
hyena_dart analyze . --format=sarif --output=hyena.sarif
```

The output is one SARIF run whose driver is `hyena_dart`. Paths are package-relative when the target belongs to a Dart package. Use `--baseline` to omit accepted findings before uploading the file.

## Programmatic reporters

All built-in reporters implement:

```dart
abstract class Reporter {
  Future<String> generate(AnalysisResult result);
}
```

See [Library API](/docs/library-api/#generate-output) for direct use and custom reporter guidance.
