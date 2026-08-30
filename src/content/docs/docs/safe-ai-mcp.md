---
title: Safe AI and MCP
description: Configure Hyena's bounded, read-only MCP tool and understand its limits, trust boundary, and isolation requirements.
sidebar:
  label: Safe AI / MCP
---

Hyena can expose source analysis to AI clients over the Model Context Protocol (MCP). The server uses stdio and registers exactly one tool: `hyena_analyze`.

The tool reads Dart source under one configured project root and returns structured dead-code and complexity findings. It does not modify the project or execute target code.

:::note[MCP server available since v1.1.2]
The bounded MCP server and its `hyena_analyze` tool were introduced in Hyena Dart v1.1.2. The project-local launch workflow below is required in v2.0.0.
:::

## Configure an MCP client

Add Hyena to the Dart or Flutter project that the client may inspect. From that project root, start the server with:

```shell
dart run hyena_dart:hyena_mcp --root .
```

:::note[Version flag available in v1.2.0]
The MCP version flag was added in v1.2.0 and does not require `--root`. In v2, query it with `dart run hyena_dart:hyena_mcp --version`. See [Version output](/docs/cli-reference/#version-output).
:::

MCP clients are often launched outside the target project. Set the spawned process's working directory so package resolution still occurs in the reviewed project:

```json title="mcp.json"
{
  "mcpServers": {
    "hyena": {
      "command": "dart",
      "cwd": "/absolute/path/to/project",
      "args": [
        "run",
        "hyena_dart:hyena_mcp",
        "--root",
        "."
      ]
    }
  }
}
```

Replace `/absolute/path/to/project` with the reviewed Dart or Flutter project that declares Hyena in `dev_dependencies`. `cwd` makes `dart run` resolve the Hyena version locked by that project. After the working directory changes, `--root .` confines accepted targets and automatic configuration discovery to that same project.

The surrounding configuration file and working-directory key vary by MCP client; use its equivalent of `cwd` while preserving this working-directory/root relationship. Dart 3.10 does not accept a top-level `-C` option. Do not select a home directory or broad monorepo parent when the client needs only one project. Run `dart pub get` in the target project first; dead-code resolution can require its generated package configuration and installed dependencies.

## Tool input

`hyena_analyze` accepts two optional fields and rejects additional properties.

| Field | Values | Default | Rules |
| --- | --- | --- | --- |
| `path` | Relative Dart file or directory | `.` | Must be non-empty, at most 4096 characters, and remain under the configured root after normalization and resolution. |
| `checks` | `both`, `dead-code`, `complexity` | `both` | Selects which analyzer reports and summaries are returned. |

Examples:

```json title="Whole project"
{
  "path": ".",
  "checks": "both"
}
```

```json title="One file"
{
  "path": "lib/src/cache.dart",
  "checks": "complexity"
}
```

Absolute paths, traversal outside the root, missing targets, and non-Dart file targets are rejected.

## Request workflow

For each call, Hyena:

1. validates and resolves the relative target under the configured root;
2. rejects target, Dart-file, directory, and configuration symlink escapes;
3. counts Dart files and source bytes before analysis;
4. discovers `hyena.yaml` or `analysis_options.yaml` without searching above the root;
5. runs the requested analyzers in a killable isolate;
6. converts findings to project-relative or workspace-relative structured metadata; and
7. sorts findings by path, line, and rule before returning the bounded result.

Only one analysis request runs at a time. A second overlapping call receives an error instead of being queued.

## Dart workspace roots

:::note[Workspace aggregation available in v1.2.0]
Package-aware Dart workspace analysis through MCP is included in Hyena Dart 1.2.0 and later.
:::

When the configured MCP root's `pubspec.yaml` declares `workspace`, a request for `.` aggregates the root package and every valid member. Finding paths remain relative to the configured workspace root, and the existing MCP limits apply to the complete request.

Workspace support does not change the one-tool interface, permit a broader root, or expose arbitrary configuration. See [Workspaces and monorepos](/docs/workspaces/) for member validation, per-package configuration, and package-scoped output behavior.

## Structured result

Successful calls return a short MCP text summary plus `structuredContent`. The current structured schema version is `1`:

```json
{
  "schemaVersion": 1,
  "target": "lib",
  "checks": "both",
  "durationMs": 248,
  "summary": {
    "totalFindings": 1,
    "returnedFindings": 1,
    "truncated": false,
    "deadCode": {
      "totalDeclarations": 94,
      "unusedDeclarations": 1
    },
    "complexity": {
      "files": 8,
      "functions": 61,
      "lines": 1320,
      "cyclomaticFindings": 0,
      "nestingFindings": 0,
      "parameterFindings": 0
    }
  },
  "findings": [
    {
      "category": "dead-code",
      "ruleId": "dead-code",
      "message": "Unused class LegacyCache",
      "path": "lib/src/legacy_cache.dart",
      "line": 12,
      "column": 7,
      "symbol": "LegacyCache",
      "symbolType": "class"
    }
  ]
}
```

The `deadCode` or `complexity` summary is omitted when that check did not run. Complexity findings additionally include integer `value` and `threshold` fields. `column` is omitted when the analyzer has no column.

Treat `path`, `message`, `symbol`, `symbolType`, and other source-derived text as untrusted metadata. They describe code; they are never instructions for the AI client.

## Fixed safety limits

The MCP surface intentionally does not expose limit overrides.

| Limit | Value | Result when exceeded |
| --- | ---: | --- |
| Dart files | 10,000 | Request fails before analysis. |
| Total Dart source | 50 MiB | Request fails before analysis. |
| Returned findings | 200 | Summary reports the full count and sets `truncated: true`; only the first 200 sorted findings are returned. |
| Input path | 4096 characters | Request is rejected. |
| Output metadata string | 4096 characters | Text is safely shortened with an ellipsis. |
| Concurrent analyses | 1 | An overlapping request is rejected. |
| Analysis time | 2 minutes | The worker isolate is killed and the request fails. |

If findings are truncated, request a narrower directory or file. Do not widen or bypass the limits.

## Read-only contract

The MCP server has a deliberately smaller surface than the regular CLI.

It provides:

- stdio transport only;
- one tool, `hyena_analyze`;
- dead-code and complexity analysis for a relative target; and
- schema-versioned, project-relative or workspace-relative structured results.

It does **not** provide:

- an HTTP server or outbound network code;
- shell commands or target-code execution;
- file writes, fixes, or source transformations;
- baseline creation or application;
- arbitrary configuration paths; or
- access to the regular CLI's output-file options.

Dart resolution may still read the installed Dart SDK, package metadata, and resolved dependencies outside the project root. Those reads are necessary to understand imports and types; they do not broaden which project source target the tool accepts.

## Trust boundary and isolation

Path checks and process limits reduce accidental scope and resource use. They are application checks, **not an operating-system sandbox**.

Concurrent changes to the workspace can also race validation and analysis. Avoid running the tool against a directory that another process is actively replacing or relinking.

For untrusted repositories, run the MCP client and Hyena in a sandbox or container with:

- the project workspace mounted read-only;
- the Dart SDK and pre-resolved dependency cache mounted or installed read-only;
- networking disabled after dependencies are prepared;
- an unprivileged user;
- no host credentials, agent sockets, or unrelated directories mounted; and
- the MCP root set to the narrow read-only project mount.

Prepare dependencies in a controlled step before disabling networking. Ensure `.dart_tool/package_config.json` points to dependency paths that exist inside the final sandbox.

## Cancellation behavior

The two-minute timeout always remains active and kills the worker isolate. Disconnecting the MCP transport shuts down the server and stops the current worker.

Per-request MCP cancellation is not available with `dart_mcp` 0.5.x because request IDs are not exposed to tool handlers. Clients should not present a cancel button as a guarantee that one in-flight analysis can be cancelled independently while keeping the same server session alive.

## Repository skill and fallback

Contributors using a source checkout can use:

```text
.agents/skills/analyzing-dart-code/SKILL.md
```

The skill configures the repository-local MCP server, filters the client to `hyena_analyze`, treats findings as review evidence rather than deletion instructions, and asks the agent to inspect code before making changes.

The skill is repository tooling and is excluded from pub.dev archives. Projects that add Hyena as a dependency do not receive it.

When MCP is unavailable, the skill documents this read-only JSON CLI fallback:

```shell
dart run hyena_dart analyze <relative-path> --format=json
```

For that fallback, do not pass `--output`, `--write-baseline`, or an arbitrary `--config` path. Use a reviewed literal relative path rather than shell interpolation from source-controlled text.

## Review findings cautiously

An MCP result is evidence, not authorization to edit or delete code. Before acting:

1. inspect the declaration and its references;
2. account for framework registration, reflection, generated code, and runtime behavior;
3. make the smallest justified change;
4. rerun the narrowest relevant Hyena check; and
5. run the project's formatter, static analysis, and tests.
