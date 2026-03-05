import { Injectable, computed, inject, signal } from '@angular/core';
import Epub, { Book, NavItem } from 'epubjs';
import { IdbService, BookRecord, SearchIndexRecord } from './idb.service';
import { EpubService } from './epub.service';

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  language: string;
  importedAt: number;
  coverBlob: Blob | null;
}

export interface SearchResult {
  bookId: string;
  bookTitle: string;
  sectionHref: string;
  sectionLabel: string;
  snippet: string;
  matchIndex: number;
}

export type SortField = 'title' | 'author' | 'importedAt';
export type SortDirection = 'asc' | 'desc';

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly idb = inject(IdbService);
  private readonly epubService = inject(EpubService);

  private readonly _allBooks = signal<LibraryBook[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _importProgress = signal(0);
  private readonly _error = signal<string | null>(null);
  private readonly _searchQuery = signal('');
  private readonly _searchResults = signal<SearchResult[]>([]);
  private readonly _isSearching = signal(false);
  private readonly _sortField = signal<SortField>('importedAt');
  private readonly _sortDirection = signal<SortDirection>('desc');
  private readonly _languageFilter = signal('');

  readonly pendingNavHref = signal<string | null>(null);

  readonly isLoading = this._isLoading.asReadonly();
  readonly importProgress = this._importProgress.asReadonly();
  readonly error = this._error.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly searchResults = this._searchResults.asReadonly();
  readonly isSearching = this._isSearching.asReadonly();
  readonly sortField = this._sortField.asReadonly();
  readonly sortDirection = this._sortDirection.asReadonly();
  readonly languageFilter = this._languageFilter.asReadonly();

  readonly books = computed(() => {
    let result = [...this._allBooks()];
    const lang = this._languageFilter();
    if (lang) {
      result = result.filter(b => b.language === lang);
    }
    const field = this._sortField();
    const dir = this._sortDirection();
    result.sort((a, b) => {
      let cmp = 0;
      if (field === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (field === 'author') {
        cmp = a.author.localeCompare(b.author);
      } else {
        cmp = a.importedAt - b.importedAt;
      }
      return dir === 'asc' ? cmp : -cmp;
    });
    return result;
  });

  readonly availableLanguages = computed(() =>
    [...new Set(this._allBooks().map(b => b.language).filter(Boolean))],
  );

  async loadLibrary(): Promise<void> {
    this._isLoading.set(true);
    try {
      const records = await this.idb.getAll<BookRecord>('books');
      this._allBooks.set(
        records.map(r => ({
          id: r.id,
          title: r.title,
          author: r.author,
          language: r.language,
          importedAt: r.importedAt,
          coverBlob: r.coverBlob,
        })),
      );
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      this._isLoading.set(false);
    }
  }

  async importBooks(files: FileList | File[]): Promise<void> {
    const fileArray = Array.from(files);
    this._importProgress.set(0);
    this._error.set(null);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const arrayBuffer = await file.arrayBuffer();
        const book = Epub();
        await book.open(arrayBuffer as unknown as string);

        const [metadata, navigation] = await Promise.all([
          book.loaded.metadata,
          book.loaded.navigation,
        ]);

        const id = await this.getBookId(book);
        const coverBlob = await this.extractCover(book);
        const toc: NavItem[] = navigation.toc ?? [];

        const record: BookRecord = {
          id,
          title: metadata.title ?? file.name,
          author: metadata.creator ?? '',
          language: (metadata as unknown as Record<string, string>)['language'] ?? '',
          importedAt: Date.now(),
          coverBlob,
          arrayBuffer,
        };

        await this.idb.put('books', record);
        await this.indexBookText(book, id, toc);

        book.destroy();
      } catch (err) {
        this._error.set(
          `Failed to import ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        );
      }

      this._importProgress.set(Math.round(((i + 1) / fileArray.length) * 100));
    }

    await this.loadLibrary();
  }

  async deleteBook(id: string): Promise<void> {
    await this.idb.delete('books', id);
    await this.idb.deleteAllByIndex('search_index', 'bookId', id);
    this._allBooks.update(books => books.filter(b => b.id !== id));
    if (this._searchResults().some(r => r.bookId === id)) {
      this._searchResults.update(results => results.filter(r => r.bookId !== id));
    }
  }

  async openBook(id: string): Promise<void> {
    const record = await this.idb.get<BookRecord>('books', id);
    if (!record) throw new Error('Book not found in library');
    await this.epubService.openBookFromBuffer(record.arrayBuffer);
  }

  async search(query: string): Promise<void> {
    const q = query.trim().toLowerCase();
    this._searchQuery.set(query);

    if (!q) {
      this._searchResults.set([]);
      return;
    }

    this._isSearching.set(true);
    const results: SearchResult[] = [];
    const bookTitleMap = new Map(this._allBooks().map(b => [b.id, b.title]));

    try {
      await this.idb.openCursor<SearchIndexRecord>('search_index', record => {
        if (results.length >= 200) return;
        const idx = record.text.indexOf(q);
        if (idx === -1) return;
        const bookTitle = bookTitleMap.get(record.bookId) ?? '';
        results.push({
          bookId: record.bookId,
          bookTitle,
          sectionHref: record.sectionHref,
          sectionLabel: record.sectionLabel,
          snippet: this.buildSnippet(record.rawText, idx, q.length),
          matchIndex: idx,
        });
      });
    } finally {
      this._searchResults.set(results);
      this._isSearching.set(false);
    }
  }

  clearSearch(): void {
    this._searchQuery.set('');
    this._searchResults.set([]);
  }

  setSortField(field: SortField): void {
    this._sortField.set(field);
  }

  setSortDirection(dir: SortDirection): void {
    this._sortDirection.set(dir);
  }

  setLanguageFilter(lang: string): void {
    this._languageFilter.set(lang);
  }

  private async getBookId(book: Book): Promise<string> {
    const pkg = await (book.loaded as unknown as { metadata: Promise<{ identifier: string }> })
      .metadata;
    return pkg.identifier || `book-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private async extractCover(book: Book): Promise<Blob | null> {
    try {
      const coverUrl = await book.coverUrl();
      if (!coverUrl) return null;
      const response = await fetch(coverUrl);
      return await response.blob();
    } catch {
      return null;
    }
  }

  private async indexBookText(book: Book, bookId: string, toc: NavItem[]): Promise<void> {
    // Build href → label map from TOC (flatten nested items)
    const labelMap = new Map<string, string>();
    const flatten = (items: NavItem[]) => {
      for (const item of items) {
        labelMap.set(item.href, item.label);
        if (item.subitems?.length) flatten(item.subitems);
      }
    };
    flatten(toc);

    const sections: Array<{ href: string; label: string }> = [];
    (book.spine as unknown as { each: (fn: (section: unknown) => void) => void }).each(
      (section: unknown) => {
        const s = section as { href: string };
        sections.push({
          href: s.href,
          label: labelMap.get(s.href) ?? s.href,
        });
      },
    );

    for (const { href, label } of sections) {
      try {
        const section = book.spine.get(href) as unknown as {
          load: (fn: (path: string) => unknown) => Promise<unknown>;
          unload: () => void;
          document: Document | null;
          href: string;
        };
        if (!section) continue;

        await section.load(book.load.bind(book));
        const rawText = section.document?.documentElement?.textContent ?? '';
        section.unload();

        if (!rawText.trim()) continue;

        const record: SearchIndexRecord = {
          bookId,
          sectionHref: href,
          sectionLabel: label,
          text: rawText.toLowerCase(),
          rawText,
        };
        await this.idb.put('search_index', record);
      } catch {
        // skip sections that fail to load
      }
    }
  }

  private buildSnippet(rawText: string, idx: number, len: number): string {
    const context = 80;
    const start = Math.max(0, idx - context);
    const end = Math.min(rawText.length, idx + len + context);

    const pre = this.escapeHtml(rawText.slice(start, idx));
    const match = this.escapeHtml(rawText.slice(idx, idx + len));
    const post = this.escapeHtml(rawText.slice(idx + len, end));

    const ellipsisPre = start > 0 ? '…' : '';
    const ellipsisPost = end < rawText.length ? '…' : '';

    return `${ellipsisPre}${pre}<mark>${match}</mark>${post}${ellipsisPost}`;
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
