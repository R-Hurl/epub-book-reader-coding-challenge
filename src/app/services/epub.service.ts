import { Injectable, computed, signal } from '@angular/core';
import Epub, { Book, Rendition, NavItem } from 'epubjs';

interface EpubLocation {
  start: { cfi: string; href: string };
  atStart: boolean;
  atEnd: boolean;
}

@Injectable({ providedIn: 'root' })
export class EpubService {
  private readonly _book = signal<Book | null>(null);
  private readonly _rendition = signal<Rendition | null>(null);
  private readonly _toc = signal<NavItem[]>([]);
  private readonly _title = signal<string>('');
  private readonly _author = signal<string>('');
  private readonly _currentHref = signal<string>('');
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _canGoNext = signal<boolean>(true);
  private readonly _canGoPrev = signal<boolean>(false);

  readonly book = this._book.asReadonly();
  readonly rendition = this._rendition.asReadonly();
  readonly toc = this._toc.asReadonly();
  readonly title = this._title.asReadonly();
  readonly author = this._author.asReadonly();
  readonly currentHref = this._currentHref.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly canGoNext = this._canGoNext.asReadonly();
  readonly canGoPrev = this._canGoPrev.asReadonly();

  readonly hasBook = computed(() => this._book() !== null);
  readonly hasError = computed(() => this._error() !== null);

  async openBook(file: File): Promise<void> {
    await this.openBookFromBuffer(await file.arrayBuffer());
  }

  async openBookFromBuffer(buffer: ArrayBuffer): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const book = Epub();
      await book.open(buffer as unknown as string);

      const [metadata, navigation] = await Promise.all([
        book.loaded.metadata,
        book.loaded.navigation,
      ]);

      this._book.set(book);
      this._title.set(metadata.title ?? '');
      this._author.set(metadata.creator ?? '');
      this._toc.set(navigation.toc ?? []);
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Failed to open book');
    } finally {
      this._isLoading.set(false);
    }
  }

  attachRendition(element: HTMLElement): void {
    const book = this._book();
    if (!book) return;

    const rendition = book.renderTo(element, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
    });

    rendition.on('relocated', (location: EpubLocation) => {
      this._currentHref.set(location.start.href);
      this._canGoPrev.set(!location.atStart);
      this._canGoNext.set(!location.atEnd);
    });

    rendition.on('keyup', (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') void this.goNext();
      if (e.key === 'ArrowLeft') void this.goPrev();
    });

    this._rendition.set(rendition);
    void rendition.display();
  }

  async goNext(): Promise<void> {
    await this._rendition()?.next();
  }

  async goPrev(): Promise<void> {
    await this._rendition()?.prev();
  }

  async goToHref(href: string): Promise<void> {
    await this._rendition()?.display(href);
  }

  destroyBook(): void {
    const rendition = this._rendition();
    if (rendition) rendition.destroy();

    const book = this._book();
    if (book) book.destroy();

    this._book.set(null);
    this._rendition.set(null);
    this._toc.set([]);
    this._title.set('');
    this._author.set('');
    this._currentHref.set('');
    this._isLoading.set(false);
    this._error.set(null);
    this._canGoNext.set(true);
    this._canGoPrev.set(false);
  }
}
