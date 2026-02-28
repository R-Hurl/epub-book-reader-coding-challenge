import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';

import { EpubService } from '../../services/epub.service';
import { ReaderToolbarComponent } from './components/reader-toolbar/reader-toolbar.component';
import { TocPanelComponent } from './components/toc-panel/toc-panel.component';
import { ReaderViewerComponent } from './components/reader-viewer/reader-viewer.component';
import { NavControlsComponent } from './components/nav-controls/nav-controls.component';

@Component({
  selector: 'app-reader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatSidenavModule,
    ReaderToolbarComponent,
    TocPanelComponent,
    ReaderViewerComponent,
    NavControlsComponent,
  ],
  templateUrl: './reader.component.html',
  styleUrl: './reader.component.scss',
})
export class ReaderComponent implements OnDestroy {
  protected readonly epubService = inject(EpubService);
  private readonly router = inject(Router);

  protected readonly sidenavOpen = signal(true);

  constructor() {
    effect(() => {
      if (!this.epubService.hasBook()) {
        void this.router.navigate(['/']);
      }
    });
  }

  protected toggleSidenav(): void {
    this.sidenavOpen.update(open => !open);
  }

  protected goToHref(href: string): void {
    void this.epubService.goToHref(href);
  }

  protected goNext(): void {
    void this.epubService.goNext();
  }

  protected goPrev(): void {
    void this.epubService.goPrev();
  }

  ngOnDestroy(): void {
    this.epubService.destroyBook();
  }
}
