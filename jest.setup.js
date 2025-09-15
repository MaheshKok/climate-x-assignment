import '@testing-library/jest-dom';

// Global test setup
beforeEach(() => {
  // Reset any mocks before each test
  jest.clearAllMocks();
});

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock window.fetch for API tests
global.fetch = jest.fn();

// Mock File and FileReader for file upload tests
global.File = class MockFile {
  constructor(fileBits, fileName, options = {}) {
    this.bits = fileBits;
    this.name = fileName;
    this.size = fileBits.reduce((acc, bit) => acc + bit.length, 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

global.FileReader = class MockFileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
  }

  readAsText(file) {
    this.readyState = 2;

    // Handle MockFile objects with bits array
    if (file && file.bits && Array.isArray(file.bits)) {
      this.result = file.bits.join('');
    } else if (typeof file === 'string') {
      this.result = file;
    } else {
      this.result = 'mocked file content';
    }

    // Use setTimeout to simulate async behavior
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: this });
      }
    }, 0);
  }

  readAsDataURL(file) {
    this.readyState = 2;
    this.result = 'data:text/plain;base64,bW9ja2VkIGZpbGUgY29udGVudA==';

    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: this });
      }
    }, 0);
  }
};

// Mock FormData
global.FormData = class MockFormData {
  constructor() {
    this.data = new Map();
  }

  append(key, value) {
    this.data.set(key, value);
  }

  get(key) {
    return this.data.get(key);
  }

  has(key) {
    return this.data.has(key);
  }
};
