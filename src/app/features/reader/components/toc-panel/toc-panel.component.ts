import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { NavItem } from 'epubjs';

@Component({
  selector: 'app-toc-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule],
  templateUrl: './toc-panel.component.html',
  styleUrl: './toc-panel.component.scss',
})
export class TocPanelComponent {
  readonly tocItems = input.required<NavItem[]>();
  readonly currentHref = input<string>('');

  readonly navigateTo = output<string>();

  protected isActive(item: NavItem): boolean {
    const current = this.currentHref();
    if (!current) return false;
    return item.href.split('#')[0] === current.split('#')[0];
  }
}
