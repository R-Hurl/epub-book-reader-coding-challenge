import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon" aria-hidden="true">auto_stories</mat-icon>
      <h2 class="empty-heading">Your library is empty</h2>
      <p class="empty-hint">Import EPUB files to start building your collection.</p>
    </div>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }

    .empty-icon {
      font-size: 5rem;
      width: 5rem;
      height: 5rem;
      margin-bottom: 1.5rem;
      opacity: 0.5;
    }

    .empty-heading {
      font-size: 1.5rem;
      font-weight: 500;
      margin: 0 0 0.5rem;
    }

    .empty-hint {
      font-size: 1rem;
      margin: 0;
      opacity: 0.7;
    }
  `,
})
export class EmptyStateComponent {}
