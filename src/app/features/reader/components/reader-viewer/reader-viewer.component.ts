import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { EpubService } from '../../../../services/epub.service';

@Component({
  selector: 'app-reader-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div
      #viewerContainer
      class="viewer-container"
      tabindex="-1"
      role="main"
      aria-label="Book content"
      aria-live="polite"
    ></div>
  `,
  styles: [`
    :host {
      display: block;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .viewer-container {
      width: 100%;
      height: 100%;
      outline: none;
    }
  `],
})
export class ReaderViewerComponent implements OnDestroy {
  private readonly epubService = inject(EpubService);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('viewerContainer');
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => {
      const el = this.container().nativeElement;
      this.epubService.attachRendition(el);

      this.resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        this.epubService.rendition()?.resize(width, height);
      });
      this.resizeObserver.observe(el);

      // Focus viewer after render for keyboard navigation
      el.focus();
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }
}
