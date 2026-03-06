import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import { ReaderThemeService } from '../../../../services/reader-theme.service';

@Component({
  selector: 'app-theme-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatButtonToggleModule, MatDividerModule, MatIconModule],
  templateUrl: './theme-settings.component.html',
  styleUrl: './theme-settings.component.scss',
})
export class ThemeSettingsComponent {
  protected readonly themeService = inject(ReaderThemeService);
}
