import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-reader-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './reader-toolbar.component.html',
  styleUrl: './reader-toolbar.component.scss',
})
export class ReaderToolbarComponent {
  readonly title = input.required<string>();
  readonly author = input.required<string>();
  readonly sidenavOpen = input.required<boolean>();
  readonly settingsOpen = input.required<boolean>();

  readonly toggleSidenav = output<void>();
  readonly toggleSettings = output<void>();
}
