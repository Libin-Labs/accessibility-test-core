# @lp-labs/accessibility-test-core

Run small, deterministic accessibility checks against injected snapshots. The package accepts a DOM-like adapter but does not inspect a browser, render components, or claim full WCAG compliance.

- No runtime or peer dependencies; no browser globals.
- Strictly bounded snapshot analysis with findings tied to supplied node IDs.
- ESM, CommonJS, and TypeScript declarations.

## Install

```sh
npm install @lp-labs/accessibility-test-core
```

Requires Node.js 18+ or an ESM-aware bundler.

## Quickstart

```js
import { createAccessibilityTester } from '@lp-labs/accessibility-test-core';

const tester = createAccessibilityTester(() => ({
  nodes: [
    { id: 'title', role: 'heading1', name: 'Reports' },
    { id: 'export', role: 'button', name: 'Export report', focusable: true },
  ],
}));
const report = tester.run();
console.log(report.passed, report.findings);
```

The adapter can collect a snapshot from your own component test environment. A direct snapshot can instead be passed to `testAccessibility(snapshot, options?)`. CommonJS users can call `require('@lp-labs/accessibility-test-core')`.

## Runtime API

Runtime exports: `createAccessibilityTester`, `testAccessibility`.

- `createAccessibilityTester(adapter, options?)` accepts either a snapshot callback or an object implementing `snapshot()`. Its `run()` method asks the adapter for a fresh snapshot and returns an `AccessibilityReport`.
- `testAccessibility(snapshot, options?)` checks one `AccessibilitySnapshot` immediately.
- `AccessibilityAdapter`, `AccessibilityNode`, `AccessibilitySnapshot`, `AccessibilityOptions`, `AccessibilityFinding`, and `AccessibilityReport` are type exports.
- `AccessibilityReport` includes `nodeCount`, `passed`, and `findings`. Each finding has a `code`, explanatory `message`, and optional `nodeId`.

The checker reports these deliberately small rules:

| Code               | Check                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `missing-name`     | Visible button, link, image, checkbox, radio, switch, textbox, combobox, listbox, and menuitem nodes need a nonblank `name` or `label`. |
| `duplicate-id`     | Supplied nonempty node IDs should be unique.                                                                                            |
| `hidden-focusable` | A node marked `visible: false` must not also be `focusable: true`.                                                                      |
| `heading-order`    | In snapshot order, a heading must not skip more than one level from the preceding heading.                                              |

`visible` defaults to true. A nonblank `name` takes precedence; a blank or whitespace-only name falls back to `label`. The tool does not infer semantics, follow ARIA relationships, inspect contrast or keyboard behavior, or verify every WCAG criterion.

## Validation and customization

`maxNodes` defaults to 10,000 and must be a positive safe integer. Each snapshot is a flat `nodes` array; node roles are nonempty strings up to 128 UTF-16 units, IDs are nonempty strings, and names/labels are strings up to 4,096 units. Optional `visible` and `focusable` values must be booleans. Snapshot capacity and malformed data throw `RangeError` or `TypeError`; findings are ordinary report data, not thrown test failures.

Customize the adapter to map only the semantics your test harness can observe. Keep collection separate from evaluation so that snapshots can also be saved as regression fixtures. Consumers decide which findings fail CI; the package provides no runner integration, DOM dependency, automated fixes, ruleset plug-in system, or WCAG conformance claim.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
