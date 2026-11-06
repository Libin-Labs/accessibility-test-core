import core = require('@lp-labs/accessibility-test-core');

const report: core.AccessibilityReport = core.testAccessibility({ nodes: [] });
console.log(report.passed);
