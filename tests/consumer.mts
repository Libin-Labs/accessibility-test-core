import { createAccessibilityTester, testAccessibility } from '@lp-labs/accessibility-test-core';

const tester = createAccessibilityTester(() => ({
  nodes: [{ role: 'button', name: 'Continue' }],
}));
const report = tester.run();
const staticReport = testAccessibility({ nodes: [] });
console.log(report.passed, staticReport.nodeCount);
