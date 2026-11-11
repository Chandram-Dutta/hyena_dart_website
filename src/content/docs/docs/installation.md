---
title: Installation
description: Add Hyena to a Dart or Flutter project and run the project-pinned command.
---

Hyena requires **Dart SDK 3.11 or newer (below 4.0.0)** and depends on `analyzer: ^14.0.0`. Flutter projects can use the Dart SDK bundled with Flutter.

Because Hyena is a development dependency, other dev tools in the same project, such as code generators and custom lint plugins, must also accept analyzer 14.x. If one still requires an older analyzer, `pub get` reports a version conflict.

:::note[Current release: v3.0.0]
Project-local installation and execution, introduced in v2.0.0, remains the supported workflow in v3.0.0. Upgrading from v2.x? See [Migrating to v3.0](/docs/migrating-to-v3/).
:::

## Add the development dependency

For a Dart project:

```shell
dart pub add dev:hyena_dart
```

For a Flutter project:

```shell
flutter pub add dev:hyena_dart
```

Both commands update the project's `pubspec.yaml` and resolve Hyena into that project's package configuration:

```yaml title="pubspec.yaml"
dev_dependencies:
  hyena_dart: ^3.0.0
```

Commit the resulting dependency files according to the normal rules for the project.

Hyena supports only project-local execution. Run it from the project that declares the dependency:

```shell
dart run hyena_dart analyze .
```

This resolves the Hyena version selected by the project's lockfile. It keeps local development and CI on the same analyzer version and avoids a separate global command mapping.

## Source checkout

Use a checkout when contributing to Hyena itself:

```shell
git clone https://github.com/Chandram-Dutta/hyena_dart.git
cd hyena_dart
dart pub get
dart run bin/hyena_dart.dart analyze .
```

To test that checkout from another project, declare it as a project-local path dependency:

```yaml title="pubspec.yaml"
dev_dependencies:
  hyena_dart:
    path: ../hyena_dart
```

Then run `dart pub get` and invoke `dart run hyena_dart ...` from the consuming project.

## Prepare the target

Before running dead-code analysis, resolve the target package:

```shell
dart pub get
```

Dead-code analysis asks the official Dart analyzer to resolve every included Dart file. A file that fails to resolve, has analysis or syntax errors, or cannot be read is skipped: Hyena prints `Warning: skipped <path>: <reason>` to stderr and keeps analyzing the rest of the target. Skipped files do not change the exit code. Complexity-only analysis parses syntax and does not require resolved elements.

If the project uses code generation, run it before analysis so generated files are up to date.

## Confirm the installation

```shell
dart run hyena_dart --help
dart run hyena_dart complexity --help
dart run hyena_dart --version
dart run hyena_dart:hyena_mcp --version
```

You should see the `analyze`, `dead-code`, and `complexity` commands. The version commands print `hyena_dart 3.0.0` and `hyena_mcp 3.0.0` respectively.

See [Migrating from v2.x to v3.0](/docs/migrating-to-v3/) before updating an existing v2 installation, or [Migrating from v1.x to v2.0](/docs/migrating-to-v2/) for an older one.
