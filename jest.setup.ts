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
class MockFile {
  bits: string[];
  name: string;
  size: number;
  type: string;
  lastModified: number;
  webkitRelativePath: string = '';

  constructor(
    fileBits: string[],
    fileName: string,
    options: { type?: string; lastModified?: number } = {}
  ) {
    this.bits = fileBits;
    this.name = fileName;
    this.size = fileBits.reduce((acc, bit) => acc + bit.length, 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }

  bytes(): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array(0));
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    return new Blob();
  }

  stream(): ReadableStream<Uint8Array> {
    return new ReadableStream();
  }

  text(): Promise<string> {
    return Promise.resolve(this.bits.join(''));
  }
}

global.File = MockFile as any;

class MockFileReader {
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;

  readonly EMPTY = 0;
  readonly LOADING = 1;
  readonly DONE = 2;

  readyState: number;
  result: string | ArrayBuffer | null;
  error: DOMException | null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;

  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
  }

  readAsText(file: Blob) {
    this.readyState = 2;
    // Handle MockFile objects with bits array
    if (file && typeof file === 'object' && 'bits' in file && Array.isArray((file as any).bits)) {
      this.result = (file as any).bits.join('');
    } else {
      this.result = 'mocked file content';
    }

    setTimeout(() => {
      if (this.onload) {
        this.onload.call(this, {} as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  readAsDataURL(file: Blob) {
    this.readyState = 2;
    this.result = 'data:text/plain;base64,bW9ja2VkIGZpbGUgY29udGVudA==';

    setTimeout(() => {
      if (this.onload) {
        this.onload.call(this, {} as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  abort() {
    this.readyState = 2;
  }
}

global.FileReader = MockFileReader as any;

// Mock FormData
class MockFormData {
  data: Map<string, FormDataEntryValue[]>;

  constructor() {
    this.data = new Map();
  }

  append(name: string, value: string | Blob, fileName?: string) {
    const existing = this.data.get(name) || [];
    existing.push(value as FormDataEntryValue);
    this.data.set(name, existing);
  }

  delete(name: string) {
    this.data.delete(name);
  }

  get(name: string): FormDataEntryValue | null {
    const values = this.data.get(name);
    return values && values.length > 0 ? values[0] : null;
  }

  getAll(name: string): FormDataEntryValue[] {
    return this.data.get(name) || [];
  }

  has(name: string): boolean {
    return this.data.has(name);
  }

  set(name: string, value: string | Blob, fileName?: string) {
    this.data.set(name, [value as FormDataEntryValue]);
  }

  forEach(callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void) {
    this.data.forEach((values, key) => {
      values.forEach(value => callbackfn(value, key, this as any));
    });
  }

  entries(): IterableIterator<[string, FormDataEntryValue]> {
    const entries: [string, FormDataEntryValue][] = [];
    this.data.forEach((values, key) => {
      values.forEach(value => entries.push([key, value]));
    });
    return entries[Symbol.iterator]();
  }

  keys(): IterableIterator<string> {
    return this.data.keys();
  }

  values(): IterableIterator<FormDataEntryValue> {
    const values: FormDataEntryValue[] = [];
    this.data.forEach(entryValues => {
      values.push(...entryValues);
    });
    return values[Symbol.iterator]();
  }

  [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]> {
    return this.entries();
  }
}

global.FormData = MockFormData as any;
