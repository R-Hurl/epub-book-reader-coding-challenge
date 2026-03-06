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
import { LibraryService } from '../../services/library.service';
import { ReaderThemeService } from '../../services/reader-theme.service';
import { ReaderToolbarComponent } from './components/reader-toolbar/reader-toolbar.component';
import { TocPanelComponent } from './components/toc-panel/toc-panel.component';
import { ReaderViewerComponent } from './components/reader-viewer/reader-viewer.component';
import { NavControlsComponent } from './components/nav-controls/nav-controls.component';
import { ThemeSettingsComponent } from './components/theme-settings/theme-settings.component';

@Component({
  selector: 'app-reader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatSidenavModule,
    ReaderToolbarComponent,
    TocPanelComponent,
    ReaderViewerComponent,
    NavControlsComponent,
    ThemeSettingsComponent,
  ],
  templateUrl: './reader.component.html',
  styleUrl: './reader.component.scss',
})
export class ReaderComponent implements OnDestroy {
  protected readonly epubService = inject(EpubService);
  private readonly router = inject(Router);
  private readonly libraryService = inject(LibraryService);
  // Injected to ensure the service is instantiated (applies shell theme on load)
  protected readonly themeService = inject(ReaderThemeService);

  protected readonly sidenavOpen = signal(true);
  protected readonly settingsOpen = signal(false);

  constructor() {
    effect(() => {
      if (!this.epubService.hasBook()) {
        void this.router.navigate(['/']);
      }
    });

    effect(
      () => {
        const href = this.libraryService.pendingNavHref();
        const rendition = this.epubService.rendition();
        if (href && rendition) {
          void this.epubService.goToHref(href);
          this.libraryService.pendingNavHref.set(null);
        }
      },
      { allowSignalWrites: true },
    );
  }

  protected toggleSidenav(): void {
    this.sidenavOpen.update(open => !open);
  }

  protected toggleSettings(): void {
    this.settingsOpen.update(open => !open);
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
