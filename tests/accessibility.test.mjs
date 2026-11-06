import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccessibilityTester, testAccessibility } from '../dist/esm/index.js';

test('injected snapshots can be checked without browser globals', () => {
  const tester = createAccessibilityTester(() => ({
    nodes: [
      { role: 'heading1', name: 'Overview' },
      { role: 'button', name: 'Save', focusable: true },
    ],
  }));
  assert.deepEqual(tester.run(), { nodeCount: 2, findings: [], passed: true });
});

test('checks visible named controls', () => {
  const report = testAccessibility({ nodes: [{ id: 'save', role: 'button' }] });
  assert.equal(report.passed, false);
  assert.equal(report.findings[0].code, 'missing-name');
  assert.equal(report.findings[0].nodeId, 'save');
});

test('falls back from blank names to explicit labels', () => {
  const report = testAccessibility({
    nodes: [{ role: 'button', name: ' ', label: 'Save changes' }],
  });
  assert.equal(report.passed, true);
});

test('checks duplicate IDs and hidden focus targets', () => {
  const report = testAccessibility({
    nodes: [
      { id: 'same', role: 'generic' },
      { id: 'same', role: 'generic', visible: false, focusable: true },
    ],
  });
  assert.deepEqual(
    report.findings.map(({ code }) => code),
    ['duplicate-id', 'hidden-focusable'],
  );
});

test('reports skipped heading levels', () => {
  const report = testAccessibility({
    nodes: [{ role: 'heading1' }, { role: 'heading3', id: 'details' }],
  });
  assert.equal(report.findings[0].code, 'heading-order');
  assert.equal(report.findings[0].nodeId, 'details');
});

test('hidden controls are excluded from name checks', () => {
  assert.equal(testAccessibility({ nodes: [{ role: 'button', visible: false }] }).passed, true);
});

test('adapter methods are invoked for each run', () => {
  let calls = 0;
  const tester = createAccessibilityTester({
    snapshot() {
      calls++;
      return { nodes: [] };
    },
  });
  tester.run();
  tester.run();
  assert.equal(calls, 2);
});

test('node bounds and malformed snapshots are rejected', () => {
  assert.throws(
    () => testAccessibility({ nodes: [{ role: 'generic' }] }, { maxNodes: 0 }),
    RangeError,
  );
  assert.throws(
    () =>
      createAccessibilityTester(() => ({ nodes: [{ role: 'generic' }, { role: 'generic' }] }), {
        maxNodes: 1,
      }).run(),
    /capacity/,
  );
  assert.throws(() => testAccessibility({ nodes: [{ role: '' }] }), /roles/);
});

test('invalid adapters are rejected', () => {
  assert.throws(() => createAccessibilityTester(null), TypeError);
  assert.throws(() => createAccessibilityTester(() => null).run(), TypeError);
});
