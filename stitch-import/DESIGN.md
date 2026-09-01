---
name: Forensic Archive
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#ddc0b6'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a58b82'
  outline-variant: '#57423a'
  surface-tint: '#ffb598'
  primary: '#ffb598'
  on-primary: '#591d00'
  primary-container: '#e2703e'
  on-primary-container: '#4e1800'
  inverse-primary: '#a04010'
  secondary: '#aac7ff'
  on-secondary: '#002f65'
  secondary-container: '#0072e3'
  on-secondary-container: '#fefcff'
  tertiary: '#bec7d2'
  on-tertiary: '#29313a'
  tertiary-container: '#89929c'
  on-tertiary-container: '#222b33'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb598'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#7e2c00'
  secondary-fixed: '#d7e3ff'
  secondary-fixed-dim: '#aac7ff'
  on-secondary-fixed: '#001b3e'
  on-secondary-fixed-variant: '#00458e'
  tertiary-fixed: '#dae3ee'
  tertiary-fixed-dim: '#bec7d2'
  on-tertiary-fixed: '#141c24'
  on-tertiary-fixed-variant: '#3f4850'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-dense:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
  code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  gutter: 12px
  margin-mobile: 12px
  margin-desktop: 24px
---

## Brand & Style

The design system is engineered for **Digital Forensics and Research**. It prioritizes high data density, rapid scanning, and institutional authority. The aesthetic is a fusion of **Modern Minimalism** and **Technical Brutalism**, utilizing a "Terminal-as-Interface" philosophy.

The goal is to evoke a sense of calm, objective analysis. There are no decorative gradients, rounded "bubbles," or soft shadows. Instead, the UI relies on sharp hairline borders, mono-spaced metadata, and a restricted color palette to convey precision. The interface remains invisible, allowing the recovered data to take center stage.

- **Minimalism:** Use heavy negative space between logical sections but tight padding within data rows to maximize information density.
- **Precision-Focused:** Every pixel must serve a functional purpose. 
- **Institutional Authority:** The UI should feel like a professional tool used by archivists or researchers, not a social media application.

## Colors

The palette is strictly functional, using color as a semantic signal rather than decoration.

- **Primary Canvas:** The default is a near-black Dark Mode (`#121212`). For high-efficiency devices, a true AMOLED Black (`#000000`) is utilized. A Light Archival mode (`#F5F5F5`) is available for document exports.
- **Accents:** 
    - **Muted Terracotta (`#D96A38`):** Used sparingly for primary actions and brand presence. It is desaturated to prevent visual fatigue.
    - **Scholarly Blue (`#388BFD`):** Used for navigation, links, and active metadata filters.
- **Semantic Statuses:** 
    - **Visible (Green):** Active records.
    - **Deleted (Red):** User-removed content.
    - **Removed (Amber):** Moderator-actioned content.
    - **Edited (Blue):** Revised records.
- **Borders:** Use `#30363D` (Dark) or `#D1D5DA` (Light) for all hairline separators.

## Typography

Typography is optimized for legibility and data density. **Inter** provides a neutral, modern foundation for readability, while **JetBrains Mono** is used for all technical metadata, timestamps, and system IDs to ensure character alignment and a forensic feel.

- **Headlines:** Use tight letter-spacing to maintain a compact feel even at larger sizes.
- **Body Content:** Recovered posts use `body-base`. Dense comment threads and metadata tables use `body-dense` to fit more information on screen.
- **Metadata:** Use `label-caps` for all status badges and category labels to differentiate them from interactive text.
- **Tabular Data:** All counts (Karma, Comment Counts) must use `code` or JetBrains Mono to ensure numbers align vertically in lists.

## Layout & Spacing

This design system uses a **Fluid Grid** model with a maximum container width of 1280px for standard research views.

- **Rhythm:** A strict 4px baseline grid. Most components use `sm` (8px) or `md` (12px) internal padding.
- **Density:** Gaps between cards are minimized to `sm` (8px) to allow for a "stream of data" appearance.
- **Structure:**
    - **Desktop:** A two-column "Workbench" layout. Left Sidebar (300px) for filters and profile overview; Right Main (Fluid) for the data feed.
    - **Mobile:** Single column with a fixed bottom-bar for critical search actions and a top-drawer for filters.
- **Borders over Margins:** Use 1px hairline borders to separate content instead of large whitespace gaps.

## Elevation & Depth

Elevation is conveyed through **Tonal Layering** and **Hairline Outlines**. Shadows are strictly prohibited to maintain the flat, technical aesthetic.

- **Level 0 (Background):** `#121212` (Base canvas).
- **Level 1 (Cards/Containers):** `#1A1A1A` (Subtle lift).
- **Level 2 (In-set/Inputs):** `#0D1117` (Sunken feel for search bars and code blocks).
- **Outlines:** Every container must have a 1px solid border (`#30363D`). 
- **Focus States:** Active elements use a 1px Scholarly Blue (`#388BFD`) border without any outer glow or blur.

## Shapes

The shape language is **Soft-Geometric**. We use minimal rounding to maintain a professional, structured look.

- **Base Radius (0.25rem):** Used for all data cards, input fields, and standard buttons.
- **Large Radius (0.5rem):** Used only for primary container blocks like the main search dashboard.
- **Pill (Full):** Used exclusively for semantic status badges (Deleted, Removed, etc.) to distinguish them as non-interactive status indicators.

## Components

### Buttons
- **Primary:** Filled `#D96A38`, white text, no shadow.
- **Ghost (Default):** Transparent background, 1px `#30363D` border, muted text. Hover state shifts background to `#21262D`.
- **Tabs:** Minimalist underline style. Active tab has a 2px bottom border in `#388BFD`.

### Cards (Research Containers)
- **Style:** Flat surface, 1px hairline border, `p-3` (12px) padding.
- **Header:** Title (Bold) and Subreddit (Muted Mono) on one line.
- **Footer:** Metadata row using mono-spaced font for timestamps and IDs.

### Status Badges
- Small, pill-shaped.
- **Contrast:** High-contrast text on a low-opacity background tint of the semantic color (e.g., Deleted = Red text on dark-red background).\n- **Input Fields**
- Flat, slightly darker than card background (`#0D1117`).
- Mono-spaced font for the input text to ensure precision.
- No rounded ends; use the standard 4px `rounded-sm`.

### Data Grids
- Use zebra-striping with subtle tone shifts (`#161616` vs `#1A1A1A`) rather than borders for multi-row archival tables.
