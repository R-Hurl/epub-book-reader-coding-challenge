import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EpubService, EPUB_FACTORY } from './epub.service';

// ---------------------------------------------------------------------------
// Mock objects
// ---------------------------------------------------------------------------

const mockRendition = {
  on: vi.fn(),
  display: vi.fn().mockResolvedValue(undefined),
  next: vi.fn().mockResolvedValue(undefined),
  prev: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
};

const mockBook = {
  open: vi.fn().mockResolvedValue(undefined),
  loaded: {
    metadata: Promise.resolve({ title: 'Test Book', creator: 'Test Author' }),
    navigation: Promise.resolve({
      toc: [{ id: '1', href: 'ch1.html', label: 'Chapter 1' }],
    }),
  },
  renderTo: vi.fn().mockReturnValue(mockRendition),
  destroy: vi.fn(),
};

const mockEpubFactory = vi.fn(() => mockBook);

function resetMocks() {
  Object.values(mockRendition).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockClear());
  mockBook.open.mockClear();
  mockBook.renderTo.mockClear();
  mockBook.destroy.mockClear();
  mockEpubFactory.mockClear();

  mockBook.loaded = {
    metadata: Promise.resolve({ title: 'Test Book', creator: 'Test Author' }),
    navigation: Promise.resolve({
      toc: [{ id: '1', href: 'ch1.html', label: 'Chapter 1' }],
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EpubService', () => {
  let service: EpubService;

  beforeEach(() => {
    resetMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: EPUB_FACTORY, useValue: mockEpubFactory }],
    });
    service = TestBed.inject(EpubService);
  });

  // ── 1. Initial State ───────────────────────────────────────────────────

  describe('initial state', () => {
    it('should have null book signal', () => {
      expect(service.book()).toBeNull();
    });

    it('should have false isLoading signal', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('should have null error signal', () => {
      expect(service.error()).toBeNull();
    });

    it('should have canGoNext = true', () => {
      expect(service.canGoNext()).toBe(true);
    });

    it('should have canGoPrev = false', () => {
      expect(service.canGoPrev()).toBe(false);
    });

    it('hasBook computed should be false', () => {
      expect(service.hasBook()).toBe(false);
    });

    it('hasError computed should be false', () => {
      expect(service.hasError()).toBe(false);
    });
  });

  // ── 2. openBookFromBuffer — success & error (TODO: human) ──────────────

  describe('openBookFromBuffer()', () => {
    // TODO(human): Implement the success test case below.
    //
    // Success path should verify:
    //   - isLoading is true *during* loading (start the call, check before awaiting)
    //   - After awaiting, book() is not null
    //   - title() === 'Test Book', author() === 'Test Author'
    //   - toc() has one item with href 'ch1.html'
    //   - isLoading() is false after completion
    //   - hasBook() === true
    //
    // Hint: call `const p = service.openBookFromBuffer(new ArrayBuffer(0))`
    //       check isLoading() before awaiting, then `await p` and check the rest.
    it('success: sets book, title, author, toc and clears isLoading', async () => {
      const p = service.openBookFromBuffer(new ArrayBuffer(0));
      expect(service.isLoading()).toBe(true);
      await p;
      expect(service.book()).toBe(mockBook);
      expect(service.title()).toBe('Test Book');
      expect(service.author()).toBe('Test Author');
      expect(service.toc()).toEqual([{ id: '1', href: 'ch1.html', label: 'Chapter 1' }]);
      expect(service.isLoading()).toBe(false);
      expect(service.hasBook()).toBe(true);
    });

    // TODO(human): Implement the error test case below.
    //
    // Error path should verify:
    //   - When mockBook.open rejects with new Error('load failed'),
    //     error() equals 'load failed'
    //   - isLoading() is false after rejection (finally block ran)
    //   - hasError() === true
    //   - hasBook() remains false
    //
    // Hint: use `mockBook.open.mockRejectedValueOnce(new Error('load failed'))`
    //       before calling openBookFromBuffer, then await it.

    it('error: sets error signal and clears isLoading on failure', async () => {
      mockBook.open.mockRejectedValueOnce(new Error('load failed'));
      await service.openBookFromBuffer(new ArrayBuffer(0));
      expect(service.error()).toBe('load failed');
      expect(service.isLoading()).toBe(false);
      expect(service.hasError()).toBe(true);
      expect(service.hasBook()).toBe(false);
    });
  });

  // ── 3. openBook(file) ──────────────────────────────────────────────────

  describe('openBook()', () => {
    it('should delegate to openBookFromBuffer with file.arrayBuffer() result', async () => {
      const buffer = new ArrayBuffer(8);
      const file = { arrayBuffer: vi.fn().mockResolvedValue(buffer) } as unknown as File;
      await service.openBook(file);
      expect(mockBook.open).toHaveBeenCalledWith(buffer);
    });
  });

  // ── 4. attachRendition() ──────────────────────────────────────────────

  describe('attachRendition()', () => {
    it('should be a no-op when book is null', () => {
      service.attachRendition(document.createElement('div'));
      expect(mockBook.renderTo).not.toHaveBeenCalled();
    });

    it('should call book.renderTo with correct options', async () => {
      await service.openBookFromBuffer(new ArrayBuffer(0));
      const el = document.createElement('div');
      service.attachRendition(el);
      expect(mockBook.renderTo).toHaveBeenCalledWith(el, {
        width: '100%',
        height: '100%',
        flow: 'paginated',
      });
    });

    it('should register relocated and keyup handlers on rendition', async () => {
      await service.openBookFromBuffer(new ArrayBuffer(0));
      service.attachRendition(document.createElement('div'));
      const registeredEvents = mockRendition.on.mock.calls.map(([event]) => event);
      expect(registeredEvents).toContain('relocated');
      expect(registeredEvents).toContain('keyup');
    });

    it('should set rendition signal and call rendition.display()', async () => {
      await service.openBookFromBuffer(new ArrayBuffer(0));
      service.attachRendition(document.createElement('div'));
      expect(service.rendition()).toBe(mockRendition);
      expect(mockRendition.display).toHaveBeenCalled();
    });
  });

  // ── 5. relocated event handler ────────────────────────────────────────

  describe('relocated event', () => {
    it('should update currentHref, canGoPrev, canGoNext from location', async () => {
      await service.openBookFromBuffer(new ArrayBuffer(0));
      service.attachRendition(document.createElement('div'));

      const relocatedCall = mockRendition.on.mock.calls.find(([e]) => e === 'relocated');
      const handler = relocatedCall?.[1] as (loc: unknown) => void;

      handler({ start: { href: 'ch2.html', cfi: '' }, atStart: false, atEnd: false });

      expect(service.currentHref()).toBe('ch2.html');
      expect(service.canGoPrev()).toBe(true);
      expect(service.canGoNext()).toBe(true);
    });
  });

  // ── 6. Navigation methods ─────────────────────────────────────────────

  describe('navigation methods', () => {
    it('goNext() should call rendition.next()', async () => {
      await service.openBookFromBuffer(new ArrayBuffer(0));
      service.attachRendition(document.createElement('div'));
      await service.goNext();
      expect(mockRendition.next).toHaveBeenCalled();
    });

    it('goPrev() should call rendition.prev()', async () => {
      await service.openBookFromBuffer(new ArrayBuffer(0));
      service.attachRendition(document.createElement('div'));
      await service.goPrev();
      expect(mockRendition.prev).toHaveBeenCalled();
    });

    it('goToHref() should call rendition.display() with the href', async () => {
      await service.openBookFromBuffer(new ArrayBuffer(0));
      service.attachRendition(document.createElement('div'));
      mockRendition.display.mockClear();
      await service.goToHref('ch1.html');
      expect(mockRendition.display).toHaveBeenCalledWith('ch1.html');
    });

    it('goNext() should be a no-op when rendition is null', async () => {
      await service.goNext();
      expect(mockRendition.next).not.toHaveBeenCalled();
    });

    it('goPrev() should be a no-op when rendition is null', async () => {
      await service.goPrev();
      expect(mockRendition.prev).not.toHaveBeenCalled();
    });

    it('goToHref() should be a no-op when rendition is null', async () => {
      await service.goToHref('ch1.html');
      expect(mockRendition.display).not.toHaveBeenCalled();
    });
  });

  // ── 7. destroyBook() (TODO: human) ───────────────────────────────────

  describe('destroyBook()', () => {
    // TODO(human): Implement the destroyBook test cases.
    //
    // Set up state first:
    //   await service.openBookFromBuffer(new ArrayBuffer(0));
    //   service.attachRendition(document.createElement('div'));
    //   service.destroyBook();
    //
    // Then verify across two it() blocks:
    //
    // Test 1 — teardown calls:
    //   - mockRendition.destroy was called
    //   - mockBook.destroy was called
    //
    // Test 2 — signal reset:
    //   - book() is null, hasBook() === false
    //   - title() and author() are empty strings
    //   - toc() is an empty array ([])
    //   - canGoNext() === true, canGoPrev() === false

    it('should call rendition.destroy() and book.destroy()', async () => {
      await service.openBookFromBuffer(new ArrayBuffer(0));
      service.attachRendition(document.createElement('div'));
      service.destroyBook();
      expect(mockRendition.destroy).toHaveBeenCalled();
      expect(mockBook.destroy).toHaveBeenCalled();
    });

    it('should reset all signals to initial values', async () => {
      await service.openBookFromBuffer(new ArrayBuffer(0));
      service.attachRendition(document.createElement('div'));
      service.destroyBook();
      expect(service.book()).toBeNull();
      expect(service.hasBook()).toBe(false);
      expect(service.title()).toBe('');
      expect(service.author()).toBe('');
      expect(service.toc()).toEqual([]);
      expect(service.canGoNext()).toBe(true);
      expect(service.canGoPrev()).toBe(false);
    });
  });
});
