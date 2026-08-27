---
title: Dead-code analysis
description: Understand Hyena's declaration graph, reachability roots, export handling, and current limits.
---

The dead-code analyzer resolves Dart syntax to analyzer elements, records declarations and references, and reports declarations that are not reachable from any root.

## Analysis flow

1. Collect the target Dart file, or recursively collect `*.dart` files under a target directory.
2. Apply custom and built-in exclusions.
3. Resolve every included compilation unit with the official Dart analyzer.
4. Record declarations with source-and-offset identities for their resolved analyzer elements.
5. Record references as edges from the declaration that contains each reference.
6. Establish roots such as `main`, overrides, top-level references, and configured exports.
7. Traverse the graph from all roots.
8. Report declarations not in the reachable set.

If any included file cannot be resolved or contains an analyzer error, the analysis stops and lists the failures. Run `dart pub get` in the target package before analysis.

## Recorded declarations

| Category | Details |
| --- | --- |
| Types | Classes, abstract classes, mixins, named extensions, extension types, enums |
| Executables | Top-level functions, methods, getters, setters, explicit constructors |
| Data | Top-level variables, fields, enum values |
| Aliases | Function type aliases and generic type aliases |

Explicit unnamed, named, and private constructors can be emitted as standalone findings. An unnamed constructor is displayed as `Class.new`. Anonymous extensions do not have their own declaration entry.

## Reachability roots

References outside a recorded declaration are roots. Hyena also roots:

- the top-level `main` function;
- members that implement an inherited interface member, whether or not they have an `@override` annotation;
- public declarations in directly importable package libraries, library parts, and explicit exports when `ignore_exports` is enabled;
- declarations exposed by any branch of a conditional import or export;
- private declarations when `ignore_private` is enabled.

References inside a root or another reachable declaration make their target declarations reachable. This avoids treating a helper as used merely because another unreachable helper calls it.

For a Dart workspace, Hyena Dart 1.2.1 and later join these resolved edges across package boundaries before traversal. A reachable app declaration can keep the exact shared-package declaration it calls, while a same-named declaration in another package remains distinct. Calls made only from unreachable declarations still do not keep their targets alive. See [Cross-package dead-code reachability](/docs/workspaces/#cross-package-dead-code-reachability).

When an analyzer element is unavailable, Hyena falls back conservatively to matching simple and qualified names. Unresolved dynamic member access retains same-named member declarations because the runtime target cannot be proven statically. Element-based references remain the primary path.

## Configured framework roots

:::note[Available in v1.2.0]
`hyena.dead_code.entry_points` and `entry_point_annotations` are included in Hyena Dart 1.2.0 and later.
:::

Use configured roots when a router, dependency-injection system, plugin registry, serializer, or generated callback reaches declarations without a resolvable Dart reference. A matched declaration becomes a root, and normal graph traversal keeps the declarations it calls or references.

Matching a type container also preserves that container's public members. Unrelated private members and declarations outside the rooted dependency graph remain candidates, so this is narrower than excluding a file or package.

Both lists default to empty. See [Framework and generated-code entry roots](/docs/configuration/#framework-and-generated-code-entry-roots) for the YAML example and exact simple, qualified, and annotation matching rules.

## Export handling

With the default `ignore_exports: true`, Hyena treats public declarations in directly importable package libraries as API roots. A file under `lib/` is directly importable unless its package-relative path begins with `src/`. Declarations in a library's `part` files inherit that library's visibility.

Hyena also identifies public top-level declarations exposed by explicit `export` directives among the scanned units. It honors `show` and `hide` combinators and follows every conditional export branch conservatively.

An exported container also protects its public members and public constructors as roots. Private members remain candidates unless `ignore_private` is also enabled.

```dart title="lib/package.dart"
export 'src/client.dart' show Client;
```

`Client` and its public surface are treated conservatively as externally reachable.

:::caution[Scan boundary]
Export and part discovery resolves relative and `package:` URIs using `.dart_tool/package_config.json`. Hyena can protect only declarations whose source files are included in the current scan.
:::

Use `--no-ignore-exports` to include exported declarations as candidates:

```shell
hyena_dart dead-code lib --no-ignore-exports
```

## Private and main declarations

`ignore_private` defaults to `false`, so unused private declarations are reported. Enable it when private hooks are invoked indirectly by tooling or conventions:

```shell
hyena_dart dead-code lib --ignore-private
```

`ignore_main` defaults to `true` and is only configurable in YAML. It omits `main` from the declaration count and candidate set. `main` remains a graph root either way.

## Suppress an intentional finding

Place a suppression immediately before a declaration reached through reflection, generated registration, or another mechanism Hyena cannot resolve:

```dart
// hyena:ignore dead-code
void registeredByName() {
  initializePlugin();
}
```

The declaration remains a graph root. Its reachable dependencies, such as `initializePlugin` above, therefore do not become cascading dead-code findings.

## Interpreting findings

Treat a finding as a static reachability claim within the scanned and resolved source, not proof that deletion is always safe. Review code reached through:

- reflection or string-based registration;
- generated source that Hyena excludes;
- native bindings, build scripts, or framework conventions;
- consumers outside the scanned package or selected target.

Prefer a narrow exclusion or an export/private policy change only when the indirect entry mechanism is intentional and understood.
