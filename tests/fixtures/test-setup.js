// Mock browser APIs for testing
if (!window.customElements) {
  window.customElements = {
    define: () => {},
    get: () => {},
    whenDefined: () => Promise.resolve()
  };
}

if (!window.File) {
  window.File = class File {
    constructor(bits, name, options = {}) {
      this.bits = bits;
      this.name = name;
      this.type = options.type || '';
      this.lastModified = options.lastModified || Date.now();
      this.size = bits.reduce((acc, bit) => acc + bit.length, 0);
    }
  };
}

// Mock fetch for API calls
window.fetch = window.fetch || async (url, options) => {
  const response = {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
    blob: async () => new Blob()
  };

  if (url.includes('/extract')) {
    response.json = async () => ({
      text: 'Extracted text content',
      html: '<p>Extracted HTML content</p>',
      metadata: { wordCount: 100, processingTime: 500 }
    });
  }

  if (url.includes('/match')) {
    response.json = async () => ({
      matches: []
    });
  }

  if (url.includes('/reviews') || url.includes('/interviews')) {
    response.json = async () => ({
      id: 'mock-id-' + Date.now()
    });
  }

  if (url.includes('/entities')) {
    response.json = async () => [];
  }

  return response;
};

// Mock CustomEvent if not available
window.CustomEvent = window.CustomEvent || function(event, params = {}) {
  params = params || { bubbles: false, cancelable: false, detail: null };
  const evt = document.createEvent('CustomEvent');
  evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
  return evt;
};

// Mock shadow DOM for testing
if (!Element.prototype.attachShadow) {
  Element.prototype.attachShadow = function() {
    this.shadowRoot = document.createElement('div');
    this.appendChild(this.shadowRoot);
    return this.shadowRoot;
  };
}

// Mock updateComplete for Web Components
Element.prototype.updateComplete = Element.prototype.updateComplete || Promise.resolve();

// Helper function to wait for async operations
window.waitFor = async (condition, timeout = 5000) => {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

// Mock Jest matchers if not available
if (!global.expect) {
  global.expect = (value) => ({
    toBe: (expected) => {
      if (value !== expected) {
        throw new Error(`Expected ${value} to be ${expected}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
      }
    },
    toBeDefined: () => {
      if (value === undefined) {
        throw new Error(`Expected value to be defined`);
      }
    },
    toBeTruthy: () => {
      if (!value) {
        throw new Error(`Expected value to be truthy`);
      }
    },
    toContain: (expected) => {
      if (!value.includes(expected)) {
        throw new Error(`Expected ${value} to contain ${expected}`);
      }
    },
    toHaveLength: (expected) => {
      if (value.length !== expected) {
        throw new Error(`Expected length ${value.length} to be ${expected}`);
      }
    },
    toBeGreaterThan: (expected) => {
      if (value <= expected) {
        throw new Error(`Expected ${value} to be greater than ${expected}`);
      }
    },
    toBeLessThan: (expected) => {
      if (value >= expected) {
        throw new Error(`Expected ${value} to be less than ${expected}`);
      }
    },
    toHaveProperty: (prop) => {
      if (!value.hasOwnProperty(prop)) {
        throw new Error(`Expected object to have property ${prop}`);
      }
    },
    toMatch: (pattern) => {
      if (!pattern.test(value)) {
        throw new Error(`Expected ${value} to match ${pattern}`);
      }
    }
  });
}

// Mock describe and it for test structure
if (!global.describe) {
  global.describe = (name, fn) => {
    console.log(`Test Suite: ${name}`);
    fn();
  };
}

if (!global.it) {
  global.it = (name, fn) => {
    console.log(`  Test: ${name}`);
    try {
      fn();
      console.log(`    ✓ Passed`);
    } catch (error) {
      console.log(`    ✗ Failed: ${error.message}`);
    }
  };
}

if (!global.beforeEach) {
  global.beforeEach = (fn) => {
    fn();
  };
}

if (!global.fail) {
  global.fail = (message) => {
    throw new Error(message);
  };
}

// Export test utilities
export { expect, describe, it, beforeEach, fail, waitFor };