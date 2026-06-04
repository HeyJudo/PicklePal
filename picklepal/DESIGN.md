---
name: Athletic Editorial
colors:
  surface: '#f4fbf5'
  surface-dim: '#d5dcd6'
  surface-bright: '#f4fbf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef5ef'
  surface-container: '#e9f0ea'
  surface-container-high: '#e3eae4'
  surface-container-highest: '#dde4de'
  on-surface: '#161d1a'
  on-surface-variant: '#3f4940'
  inverse-surface: '#2b322e'
  inverse-on-surface: '#ebf2ed'
  outline: '#6f7a70'
  outline-variant: '#becabe'
  surface-tint: '#006d3c'
  primary: '#005f34'
  on-primary: '#ffffff'
  primary-container: '#087a45'
  on-primary-container: '#a4ffc0'
  inverse-primary: '#7ada9b'
  secondary: '#006590'
  on-secondary: '#ffffff'
  secondary-container: '#3fbbfe'
  on-secondary-container: '#004868'
  tertiary: '#684e00'
  on-tertiary: '#ffffff'
  tertiary-container: '#866500'
  on-tertiary-container: '#ffe9be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#96f7b5'
  primary-fixed-dim: '#7ada9b'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#00522c'
  secondary-fixed: '#c8e6ff'
  secondary-fixed-dim: '#87ceff'
  on-secondary-fixed: '#001e2e'
  on-secondary-fixed-variant: '#004c6d'
  tertiary-fixed: '#ffdf9b'
  tertiary-fixed-dim: '#f2bf40'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5b4300'
  background: '#f4fbf5'
  on-background: '#161d1a'
  surface-variant: '#dde4de'
typography:
  display-lg:
    fontFamily: Anton
    fontSize: 72px
    fontWeight: '400'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  score-display:
    fontFamily: Archivo Narrow
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Archivo Narrow
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  editorial-offset: 48px
---

## Brand & Style
The design system embodies "Athletic Confidence"—a blend of premium social connectivity and high-energy sports editorial. The target audience consists of active pickleball players who value both the social aspect of the game and the competitive thrill of the court. 

The visual style moves away from generic SaaS patterns toward a high-impact editorial approach. It utilizes bold color blocking, diagonal structural elements, and layered imagery to create a sense of forward motion. The interface should feel bright and optimistic but grounded by professional-grade sports aesthetics, evoking the feeling of a high-end sports club during a tournament day.

## Colors
The palette is centered on "Court Green," a saturated, confident green that provides a professional foundation. "Sky Blue" acts as a vibrant energy booster for interactive elements and highlights, while "Warm Gold" is reserved for celebratory moments, achievements, and premium statuses.

Backgrounds default to "Bright Court White" to maintain a clean, airy feel. To break the monotony of standard layouts, use "High-Contrast Blocks"—large sections of deep green or blue that span the full width of the screen, creating an editorial cadence. Text on these dark blocks should always be white or gold.

## Typography
The system uses **Outfit** for its friendly yet geometric athletic feel. Headline scales are intentionally oversized to command attention. For numerical data—specifically match scores and player rankings—the system shifts to **Archivo Narrow** (Bold) to provide a compressed, technical sports broadcast look.

**Anton** is introduced for "Display" moments: hero sections, large tournament titles, and win-state overlays. Use tight tracking on large headlines to increase the "impact" of the text. All labels and secondary metadata should use the narrow sans to distinguish them from primary body copy.

## Layout & Spacing
The layout rejects the standard 12-column card grid in favor of an editorial model. Utilize a fluid system with large, intentional gutters. 

**Dynamic Layering:** Components should overlap. For example, a player profile image may break the boundary of its background container. 
**Diagonal Lines:** Use CSS `clip-path` or background svg patterns to create 3-degree diagonal section breaks between color blocks. This creates a "fast" visual rhythm.
**Asymmetric Balance:** Instead of centering everything, push primary content to the left and allow secondary stats or imagery to bleed off the right edge of the screen on desktop.

## Elevation & Depth
This system avoids soft, floating shadows. Depth is achieved through **Tonal Stacking** and **Hard Offsets**. 

Elements should feel like they are physically layered on the court. Use 1px or 2px solid borders in a slightly darker shade of the background color rather than shadows. If a shadow is necessary for a floating action button, use a high-opacity, low-blur "block shadow" (e.g., 4px offset, 0px blur) to maintain the punchy, graphic feel. Glassmorphism is used sparingly, only for "Over-the-Field" HUDs or navigation bars that sit on top of energetic background imagery.

## Shapes
Shapes are defined by a 8px (0.5rem) radius, striking a balance between the roundness of a pickleball and the precision of the court lines. 

Avoid full-pill shapes for everything except status tags and small chips. Buttons and main containers must maintain the 8px corner to feel structural and strong. Interactive containers (like "Match Cards") should use a "Cut Corner" motif on the top-right or bottom-left to reinforce the diagonal editorial theme.

## Components
- **Primary Buttons:** High-contrast (Court Green background with White text). Use 8px radius. Every primary button must include a trailing icon (e.g., an arrow or chevron) to signal action.
- **Scoreboard Cards:** Use a dark background (High-Contrast Green) with large, white Archivo Narrow numerals. Add a 4px Warm Gold accent border on the left side to denote the "Winning" side.
- **Lists:** Ditch the boxes. Use clean, horizontal dividers with ample vertical padding (24px+). The "Active" state in a list should use a full-width Sky Blue highlight.
- **Input Fields:** Use thick 2px borders (Neutral 300) that turn Court Green on focus. Label text should always be in the uppercase `label-caps` style.
- **Action Chips:** Fully rounded (pill-shaped) with a light Sky Blue tint and dark blue text, used for filtering court types or skill levels.
- **Match Banners:** Use large-scale color blocking with a diagonal background split. The "VS" should be in the Display font, overlapping both sides of the split.