import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  input,
  output,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LibraryBook } from '../../../../services/library.service';

@Component({
  selector: 'app-book-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.scss',
})
export class BookCardComponent implements OnDestroy {
  readonly book = input.required<LibraryBook>();
  readonly open = output<string>();
  readonly delete = output<string>();

  protected coverUrl: string | null = null;

  constructor() {
    effect(() => {
      const blob = this.book().coverBlob;
      if (this.coverUrl) {
        URL.revokeObjectURL(this.coverUrl);
        this.coverUrl = null;
      }
      if (blob) {
        this.coverUrl = URL.createObjectURL(blob);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.coverUrl) {
      URL.revokeObjectURL(this.coverUrl);
    }
  }

  protected onOpen(): void {
    this.open.emit(this.book().id);
  }

  protected onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.book().id);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open.emit(this.book().id);
    }
  }
}
