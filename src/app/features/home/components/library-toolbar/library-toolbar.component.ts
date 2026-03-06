import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LibraryService, SortField, SortDirection } from '../../../../services/library.service';

@Component({
  selector: 'app-library-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatToolbarModule,
  ],
  template: `
    <mat-toolbar class="toolbar" role="toolbar" aria-label="Library controls">
      <span class="toolbar-title">My Library</span>

      <div class="toolbar-controls">
        <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
          <mat-label>Search books</mat-label>
          <input
            matInput
            type="search"
            [value]="libraryService.searchQuery()"
            (input)="onSearchInput($event)"
            aria-label="Search books"
          />
          <mat-icon matSuffix aria-hidden="true">search</mat-icon>
        </mat-form-field>

        @if (libraryService.availableLanguages().length > 0) {
          <mat-form-field appearance="outline" class="lang-field" subscriptSizing="dynamic">
            <mat-label>Language</mat-label>
            <mat-select
              [value]="libraryService.languageFilter()"
              (selectionChange)="libraryService.setLanguageFilter($event.value)"
              aria-label="Filter by language"
            >
              <mat-option value="">All</mat-option>
              @for (lang of libraryService.availableLanguages(); track lang) {
                <mat-option [value]="lang">{{ lang }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-button-toggle-group
          [value]="libraryService.sortField()"
          (change)="libraryService.setSortField($event.value)"
          aria-label="Sort by"
          class="sort-toggle"
          hideSingleSelectionIndicator
        >
          <mat-button-toggle value="title" aria-label="Sort by title">Title</mat-button-toggle>
          <mat-button-toggle value="author" aria-label="Sort by author">Author</mat-button-toggle>
          <mat-button-toggle value="importedAt" aria-label="Sort by date added">Date</mat-button-toggle>
        </mat-button-toggle-group>

        <button
          mat-icon-button
          [attr.aria-label]="libraryService.sortDirection() === 'asc' ? 'Sort descending' : 'Sort ascending'"
          (click)="toggleSortDirection()"
          class="sort-dir-btn"
        >
          <mat-icon aria-hidden="true">
            {{ libraryService.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
          </mat-icon>
        </button>

        <input
          #fileInput
          type="file"
          accept=".epub"
          multiple
          aria-hidden="true"
          class="visually-hidden"
          data-testid="file-input"
          (change)="onFilesSelected($event)"
        />

        <button
          mat-raised-button
          color="primary"
          aria-label="Import EPUB books"
          data-testid="import-button"
          (click)="fileInput.click()"
        >
          <mat-icon aria-hidden="true">add</mat-icon>
          Import Books
        </button>
      </div>
    </mat-toolbar>

    @if (libraryService.importProgress() > 0 && libraryService.importProgress() < 100) {
      <mat-progress-bar
        mode="determinate"
        [value]="libraryService.importProgress()"
        aria-label="Import progress"
      />
    }
  `,
  styles: `
    .toolbar {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 1rem;
      flex-wrap: wrap;
      height: auto;
      min-height: 64px;
    }

    .toolbar-title {
      font-size: 1.25rem;
      font-weight: 500;
      margin-right: auto;
    }

    .toolbar-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .search-field {
      width: 220px;
    }

    .lang-field {
      width: 130px;
    }

    .sort-toggle {
      height: 36px;
    }

    .sort-dir-btn {
      flex-shrink: 0;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  `,
})
export class LibraryToolbarComponent {
  protected readonly libraryService = inject(LibraryService);
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.searchTimer !== null) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      void this.libraryService.search(value);
    }, 300);
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    void this.libraryService.importBooks(input.files);
    // Reset input so same file can be re-imported
    input.value = '';
  }

  protected toggleSortDirection(): void {
    const current: SortDirection = this.libraryService.sortDirection();
    this.libraryService.setSortDirection(current === 'asc' ? 'desc' : 'asc');
  }
}
