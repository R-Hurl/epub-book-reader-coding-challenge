import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import type { Rendition } from 'epubjs';

import { EpubService } from './epub.service';

export type ReaderTheme = 'light' | 'dark' | 'sepia';
export type FontFamily = 'default' | 'serif' | 'sans-serif' | 'dyslexic';
export type LineSpacing = 'compact' | 'normal' | 'relaxed';
export type MarginSize = 'none' | 'small' | 'medium' | 'large';

interface ReaderPrefs {
  theme: ReaderTheme;
  fontFamily: FontFamily;
  fontSize: number;
  lineSpacing: LineSpacing;
  margin: MarginSize;
}

const STORAGE_KEY = 'reader-theme-prefs';

const DEFAULT_PREFS: ReaderPrefs = {
  theme: 'light',
  fontFamily: 'default',
  fontSize: 100,
  lineSpacing: 'normal',
  margin: 'small',
};

const THEME_CSS: Record<ReaderTheme, Record<string, Record<string, string>>> = {
  light: {
    body: { background: '#ffffff !important', color: '#1a1a1a !important' },
  },
  dark: {
    body: { background: '#1e1e2e !important', color: '#cdd6f4 !important' },
  },
  sepia: {
    body: { background: '#f4ecd8 !important', color: '#5b4636 !important' },
  },
};

const FONT_CSS: Record<FontFamily, string> = {
  default: '',
  serif: 'Georgia, "Times New Roman", serif',
  'sans-serif': '"Helvetica Neue", Arial, sans-serif',
  dyslexic: '"OpenDyslexic", "Comic Sans MS", cursive',
};

const LINE_SPACING_CSS: Record<LineSpacing, string> = {
  compact: '1.2',
  normal: '1.5',
  relaxed: '1.8',
};

const MARGIN_CSS: Record<MarginSize, string> = {
  none: '0px',
  small: '2%',
  medium: '6%',
  large: '12%',
};

@Injectable({ providedIn: 'root' })
export class ReaderThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly epubService = inject(EpubService);

  readonly theme = signal<ReaderTheme>(DEFAULT_PREFS.theme);
  readonly fontFamily = signal<FontFamily>(DEFAULT_PREFS.fontFamily);
  readonly fontSize = signal<number>(DEFAULT_PREFS.fontSize);
  readonly lineSpacing = signal<LineSpacing>(DEFAULT_PREFS.lineSpacing);
  readonly margin = signal<MarginSize>(DEFAULT_PREFS.margin);

  constructor() {
    this.loadPrefs();

    // Apply shell theme class whenever theme changes
    effect(() => {
      this.document.documentElement.setAttribute('data-reader-theme', this.theme());
    });

    // Re-apply all settings whenever the rendition becomes available (new book loaded)
    effect(() => {
      const rendition = this.epubService.rendition();
      if (rendition) {
        this.applyAllToRendition(rendition);
      }
    });

    // Persist prefs whenever any setting changes
    effect(() => {
      this.persistPrefs({
        theme: this.theme(),
        fontFamily: this.fontFamily(),
        fontSize: this.fontSize(),
        lineSpacing: this.lineSpacing(),
        margin: this.margin(),
      });
    });
  }

  setTheme(theme: ReaderTheme): void {
    this.theme.set(theme);
    this.epubService.rendition()?.themes.select(theme);
  }

  setFontFamily(family: FontFamily): void {
    this.fontFamily.set(family);
    const rendition = this.epubService.rendition();
    if (!rendition) return;
    if (family === 'default') {
      rendition.themes.override('font-family', 'unset');
    } else {
      rendition.themes.font(FONT_CSS[family]);
    }
  }

  increaseFontSize(): void {
    const next = Math.min(this.fontSize() + 10, 200);
    this.fontSize.set(next);
    this.epubService.rendition()?.themes.fontSize(`${next}%`);
  }

  decreaseFontSize(): void {
    const next = Math.max(this.fontSize() - 10, 75);
    this.fontSize.set(next);
    this.epubService.rendition()?.themes.fontSize(`${next}%`);
  }

  setLineSpacing(spacing: LineSpacing): void {
    this.lineSpacing.set(spacing);
    this.epubService.rendition()?.themes.override('line-height', LINE_SPACING_CSS[spacing]);
  }

  setMargin(margin: MarginSize): void {
    this.margin.set(margin);
    const rendition = this.epubService.rendition();
    if (rendition) {
      const value = MARGIN_CSS[margin];
      rendition.themes.override('padding-left', value);
      rendition.themes.override('padding-right', value);
    }
  }

  private applyAllToRendition(rendition: Rendition): void {
    // Register all colour presets
    for (const [name, styles] of Object.entries(THEME_CSS)) {
      rendition.themes.register(name, styles);
    }
    rendition.themes.select(this.theme());
    rendition.themes.fontSize(`${this.fontSize()}%`);

    const fontCss = FONT_CSS[this.fontFamily()];
    if (fontCss) {
      rendition.themes.font(fontCss);
    }

    rendition.themes.override('line-height', LINE_SPACING_CSS[this.lineSpacing()]);
    const marginValue = MARGIN_CSS[this.margin()];
    rendition.themes.override('padding-left', marginValue);
    rendition.themes.override('padding-right', marginValue);
  }

  private loadPrefs(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs = { ...DEFAULT_PREFS, ...(JSON.parse(stored) as Partial<ReaderPrefs>) };
        this.theme.set(prefs.theme);
        this.fontFamily.set(prefs.fontFamily);
        this.fontSize.set(prefs.fontSize);
        this.lineSpacing.set(prefs.lineSpacing);
        this.margin.set(prefs.margin);
      }
    } catch {
      // Keep defaults on parse error
    }
  }

  private persistPrefs(prefs: ReaderPrefs): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage errors
    }
  }
}
