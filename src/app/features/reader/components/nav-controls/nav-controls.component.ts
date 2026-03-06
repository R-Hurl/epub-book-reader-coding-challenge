import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-nav-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <nav aria-label="Chapter navigation" class="nav-controls">
      <button
        mat-stroked-button
        aria-label="Previous page"
        data-testid="prev-button"
        [disabled]="!canGoPrev()"
        (click)="prev.emit()"
      >
        <mat-icon aria-hidden="true">chevron_left</mat-icon>
        Previous
      </button>
      <button
        mat-stroked-button
        aria-label="Next page"
        data-testid="next-button"
        [disabled]="!canGoNext()"
        (click)="next.emit()"
      >
        Next
        <mat-icon aria-hidden="true">chevron_right</mat-icon>
      </button>
    </nav>
  `,
  styles: [`
    .nav-controls {
      display: flex;
      justify-content: space-between;
      padding: 8px 16px;
      flex-shrink: 0;
      border-top: 1px solid var(--mat-sys-outline-variant, rgba(0,0,0,0.12));
    }
  `],
})
export class NavControlsComponent {
  readonly canGoPrev = input.required<boolean>();
  readonly canGoNext = input.required<boolean>();

  readonly prev = output<void>();
  readonly next = output<void>();
}
