import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SearchResult } from '../../../../services/library.service';

@Component({
  selector: 'app-search-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './search-panel.component.html',
  styles: `
    :host {
      display: block;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem 0.5rem;
      font-weight: 500;
      font-size: 0.95rem;
      color: var(--mat-sys-on-surface-variant);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .searching-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .result-item {
      cursor: pointer;
    }

    .result-book {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--mat-sys-primary);
    }

    .result-section {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 0.25rem;
    }

    .result-snippet {
      font-size: 0.85rem;
      line-height: 1.4;
      color: var(--mat-sys-on-surface);
    }

    :host ::ng-deep .result-snippet mark {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      border-radius: 2px;
      padding: 0 2px;
    }
  `,
})
export class SearchPanelComponent {
  readonly results = input.required<SearchResult[]>();
  readonly isSearching = input<boolean>(false);
  readonly resultSelected = output<SearchResult>();

  protected onResultClick(result: SearchResult): void {
    this.resultSelected.emit(result);
  }

  protected onResultKeydown(event: KeyboardEvent, result: SearchResult): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.resultSelected.emit(result);
    }
  }
}
