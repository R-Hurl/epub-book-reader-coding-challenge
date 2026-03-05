import { ChangeDetectionStrategy, Component, afterNextRender, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { LibraryService, SearchResult } from '../../services/library.service';
import { LibraryToolbarComponent } from './components/library-toolbar/library-toolbar.component';
import { BookCardComponent } from './components/book-card/book-card.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { SearchPanelComponent } from './components/search-panel/search-panel.component';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressBarModule,
    MatSnackBarModule,
    LibraryToolbarComponent,
    BookCardComponent,
    EmptyStateComponent,
    SearchPanelComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected readonly libraryService = inject(LibraryService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    afterNextRender(() => {
      void this.libraryService.loadLibrary();
    });
  }

  protected async openBook(id: string): Promise<void> {
    try {
      await this.libraryService.openBook(id);
      await this.router.navigate(['/reader']);
    } catch {
      this.snackBar.open('Failed to open book', 'Dismiss', { duration: 4000 });
    }
  }

  protected async deleteBook(id: string): Promise<void> {
    await this.libraryService.deleteBook(id);
  }

  protected async onSearchResultClick(result: SearchResult): Promise<void> {
    try {
      await this.libraryService.openBook(result.bookId);
      this.libraryService.pendingNavHref.set(result.sectionHref);
      await this.router.navigate(['/reader']);
    } catch {
      this.snackBar.open('Failed to open book', 'Dismiss', { duration: 4000 });
    }
  }
}
