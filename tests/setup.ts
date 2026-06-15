/**
 * Jest test setup — mocks para WebExtension APIs do Firefox/Tor Browser.
 * Este arquivo é carregado antes de cada teste.
 */

// Mock da API browser.* (WebExtension)
const mockBrowser = {
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn().mockReturnValue(false),
    },
    getURL: jest.fn((path: string) => `moz-extension://fake-id/${path}`),
  },
  tabs: {
    query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://example.com', title: 'Test' }]),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    executeScript: jest.fn().mockResolvedValue([]),
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
  },
  commands: {
    onCommand: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  sidebarAction: {
    open: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    toggle: jest.fn().mockResolvedValue(undefined),
  },
  browserAction: {
    setBadgeText: jest.fn().mockResolvedValue(undefined),
    setBadgeBackgroundColor: jest.fn().mockResolvedValue(undefined),
  },
};

// Expor como global
(globalThis as any).browser = mockBrowser;

// Mock do fetch para testes de AI client
(globalThis as any).fetch = jest.fn();

// Mock do AbortController
(globalThis as any).AbortController = class MockAbortController {
  signal = { aborted: false };
  abort() {
    (this.signal as any).aborted = true;
  }
};
