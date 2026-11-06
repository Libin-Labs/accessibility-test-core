export interface AccessibilityNode {
  id?: string;
  role: string;
  name?: string;
  label?: string;
  visible?: boolean;
  focusable?: boolean;
}

export interface AccessibilitySnapshot {
  nodes: readonly AccessibilityNode[];
}

export type AccessibilityAdapter =
  (() => AccessibilitySnapshot) | { snapshot(): AccessibilitySnapshot };

export interface AccessibilityOptions {
  maxNodes?: number;
}

export interface AccessibilityFinding {
  code: 'missing-name' | 'duplicate-id' | 'hidden-focusable' | 'heading-order';
  nodeId?: string;
  message: string;
}

export interface AccessibilityReport {
  nodeCount: number;
  findings: AccessibilityFinding[];
  passed: boolean;
}

const namedRoles = new Set([
  'button',
  'link',
  'img',
  'checkbox',
  'radio',
  'switch',
  'textbox',
  'combobox',
  'listbox',
  'menuitem',
]);

function positiveLimit(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError('maxNodes must be a positive safe integer.');
  }
  return value;
}

function readSnapshot(snapshot: AccessibilitySnapshot, maxNodes: number): AccessibilityNode[] {
  if (!snapshot || typeof snapshot !== 'object' || !Array.isArray(snapshot.nodes)) {
    throw new TypeError('Adapter must return a snapshot with a nodes array.');
  }
  if (snapshot.nodes.length > maxNodes) {
    throw new RangeError('Snapshot node capacity exceeded.');
  }
  return snapshot.nodes.map((node) => {
    if (!node || typeof node !== 'object') {
      throw new TypeError('Snapshot nodes must be objects.');
    }
    if (typeof node.role !== 'string' || node.role.length === 0 || node.role.length > 128) {
      throw new TypeError('Node roles must be nonempty strings up to 128 units.');
    }
    for (const [name, value] of [
      ['id', node.id],
      ['name', node.name],
      ['label', node.label],
    ] as const) {
      if (value !== undefined && (typeof value !== 'string' || value.length > 4096)) {
        throw new TypeError(`${name} must be a string up to 4096 units.`);
      }
    }
    for (const [name, value] of [
      ['visible', node.visible],
      ['focusable', node.focusable],
    ] as const) {
      if (value !== undefined && typeof value !== 'boolean') {
        throw new TypeError(`${name} must be a boolean.`);
      }
    }
    return node;
  });
}

function evaluate(snapshot: AccessibilitySnapshot, maxNodes: number): AccessibilityReport {
  const nodes = readSnapshot(snapshot, maxNodes);
  const findings: AccessibilityFinding[] = [];
  const ids = new Set<string>();
  let previousHeading = 0;
  for (const node of nodes) {
    const nodeId = node.id;
    if (nodeId !== undefined) {
      if (nodeId.length === 0) throw new TypeError('Node IDs must not be empty.');
      if (ids.has(nodeId)) {
        findings.push({
          code: 'duplicate-id',
          nodeId,
          message: `Duplicate node ID: ${nodeId}.`,
        });
      } else {
        ids.add(nodeId);
      }
    }
    const name = node.name?.trim() || node.label?.trim() || '';
    if (node.visible !== false && namedRoles.has(node.role) && name.trim().length === 0) {
      findings.push({
        code: 'missing-name',
        ...(nodeId === undefined ? {} : { nodeId }),
        message: `Visible ${node.role} nodes need a nonempty name or label.`,
      });
    }
    if (node.visible === false && node.focusable === true) {
      findings.push({
        code: 'hidden-focusable',
        ...(nodeId === undefined ? {} : { nodeId }),
        message: 'A hidden node must not be focusable.',
      });
    }
    const heading = /^heading[1-6]$/.exec(node.role);
    if (heading) {
      const level = Number(node.role.at(-1));
      if (previousHeading > 0 && level > previousHeading + 1) {
        findings.push({
          code: 'heading-order',
          ...(nodeId === undefined ? {} : { nodeId }),
          message: `Heading level ${level} skips level ${previousHeading + 1}.`,
        });
      }
      previousHeading = level;
    }
  }
  return { nodeCount: nodes.length, findings, passed: findings.length === 0 };
}

export function testAccessibility(
  snapshot: AccessibilitySnapshot,
  options: AccessibilityOptions = {},
): AccessibilityReport {
  return evaluate(snapshot, positiveLimit(options.maxNodes ?? 10_000));
}

export function createAccessibilityTester(
  adapter: AccessibilityAdapter,
  options: AccessibilityOptions = {},
): { run(): AccessibilityReport } {
  if (
    typeof adapter !== 'function' &&
    (!adapter || typeof adapter !== 'object' || typeof adapter.snapshot !== 'function')
  ) {
    throw new TypeError('Expected a snapshot function or snapshot adapter.');
  }
  const maxNodes = positiveLimit(options.maxNodes ?? 10_000);
  return Object.freeze({
    run() {
      const snapshot = typeof adapter === 'function' ? adapter() : adapter.snapshot();
      return evaluate(snapshot, maxNodes);
    },
  });
}
