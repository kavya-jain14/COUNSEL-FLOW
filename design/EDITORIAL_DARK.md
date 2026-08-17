---
name: CounselFlow Editorial Dark
colors:
  surface: '#141312'
  surface-dim: '#141312'
  surface-bright: '#3a3938'
  surface-container-lowest: '#0f0e0d'
  surface-container-low: '#1c1b1a'
  surface-container: '#201f1e'
  surface-container-high: '#2b2a29'
  surface-container-highest: '#363433'
  on-surface: '#e6e2e0'
  on-surface-variant: '#cbc6bc'
  inverse-surface: '#e6e2e0'
  inverse-on-surface: '#31302f'
  outline: '#949087'
  outline-variant: '#49473f'
  surface-tint: '#ccc6b9'
  primary: '#faf3e6'
  on-primary: '#333027'
  primary-container: '#ddd7ca'
  on-primary-container: '#615d53'
  inverse-primary: '#625e54'
  secondary: '#ffb695'
  on-secondary: '#571f01'
  secondary-container: '#743414'
  on-secondary-container: '#f99f76'
  tertiary: '#f9f2f9'
  on-tertiary: '#322f35'
  tertiary-container: '#dcd6dd'
  on-tertiary-container: '#605c62'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e8e2d5'
  primary-fixed-dim: '#ccc6b9'
  on-primary-fixed: '#1e1c14'
  on-primary-fixed-variant: '#4a473d'
  secondary-fixed: '#ffdbcc'
  secondary-fixed-dim: '#ffb695'
  on-secondary-fixed: '#351000'
  on-secondary-fixed-variant: '#743414'
  tertiary-fixed: '#e7e0e8'
  tertiary-fixed-dim: '#cac5cb'
  on-tertiary-fixed: '#1d1b20'
  on-tertiary-fixed-variant: '#49464b'
  background: '#141312'
  on-background: '#e6e2e0'
  surface-variant: '#363433'
typography:
  display:
    fontFamily: Geist
    fontSize: 64px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  mono-label:
    fontFamily: Space Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: '0'
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  container-max: 1440px
---

## Brand & Style

This design system is built upon a philosophy of **Atmospheric Minimalism**. It targets professional environments that demand focus, high legibility, and an aura of established authority. The aesthetic draws heavily from modern editorial design—specifically high-end architecture and legal journals—prioritizing structure and negative space over decorative elements.

The emotional response is one of calm, focused reliability. By utilizing a "Deep Charcoal" base rather than pure black, the interface feels expensive and tactile rather than digital and hollow. The interaction model is quiet; there are no aggressive transitions or neon highlights. Instead, the design system relies on the rhythmic interplay between large, airy margins and razor-sharp typographic alignment.

## Colors

The palette is rooted in a restricted, high-contrast range to maintain an editorial feel.

*   **Surface (#0C0C0B):** The foundation. Use this for the primary background of the application. It provides a softer, more sophisticated "ink-like" quality than pure black.
*   **Primary/Text (#DDD7CA):** The main agent for communication. This warm parchment shade reduces eye strain compared to pure white while maintaining high contrast against the dark surface. Use for all primary headings and body copy.
*   **Accent (#B86A45):** This Terracotta tone is the sole driver of action. Use sparingly for primary buttons, active states, and critical indicators to ensure they command immediate attention.
*   **Semantic Colors:** These have been desaturated and shifted toward warmer undertones to ensure they harmonize with the Terracotta accent. They should appear "baked-in" to the environment rather than vibrating against it.

## Typography

The typography relies on **Geist**, a typeface that embodies technical precision and modern Swiss-style clarity. 

1.  **Hierarchy through Scale:** Use the `display` and `headline-lg` roles to create clear entry points in the layout. 
2.  **Tracking:** Headlines utilize tight tracking (`-0.02em` to `-0.04em`) to feel like professional typesetting. Labels utilize wide tracking (`0.1em`) and uppercase styling to differentiate them from functional data.
3.  **Color Context:** All typography defaults to the Warm Parchment color. Secondary information should use a 60% opacity of the Parchment color rather than a new hex code to maintain tonal consistency.

## Layout & Spacing

This design system employs a **Fixed-Column Grid** with extreme internal margins to simulate the layout of a broadsheet newspaper.

*   **Desktop:** A 12-column grid with a maximum width of 1440px. Use 64px outer margins to "float" the content in the center of the screen, emphasizing the Deep Charcoal backdrop.
*   **Tablet:** 8-column grid with 32px margins.
*   **Mobile:** 4-column grid with 20px margins.

The spacing rhythm is strictly based on a **4px baseline**. All vertical gaps between elements must be multiples of 8px (e.g., 8, 16, 24, 32, 48, 64). Use larger gaps (48px+) between major sections to maintain the minimalist editorial aesthetic.

## Elevation & Depth

To maintain the "flat editorial" look, this design system **avoids drop shadows entirely.** Depth is achieved through color layering and delicate outlines:

1.  **Level 0 (Base):** The Deep Charcoal surface (`#0C0C0B`).
2.  **Level 1 (Surface-Above):** A slightly lighter shade created by applying a 4% white overlay to the base. Used for cards and secondary sidebars.
3.  **Outlines:** Surfaces are defined by 1px solid borders using the Parchment color at 10% opacity. This creates a "ghost border" effect that is visible but non-intrusive.
4.  **Active Depth:** When an element is focused or active, increase the border opacity to 40% rather than adding a shadow.

## Shapes

The design system uses **Sharp (0px)** corners for all primary containers, buttons, and input fields. This choice reinforces the architectural, structured nature of the brand.

Exceptions are made only for:
*   **Status Indicators:** Small circular dots for "active/inactive" states.
*   **Avatars:** Circular clips for user profiles to provide a organic counterpoint to the rigid grid.

## Components

### Buttons
*   **Primary:** Solid Terracotta background with Deep Charcoal text. No border. Sharp corners.
*   **Secondary:** Ghost style. 1px Parchment border (20% opacity). Parchment text. On hover, background fills to 10% Parchment opacity.
*   **Tertiary:** Text only, uppercase, 0.1em letter spacing.

### Input Fields
*   **Standard:** Transparent background, 1px bottom-border only (30% Parchment opacity). Labels sit above the field in the `label-md` style.
*   **Focus State:** Bottom border changes to solid Terracotta.

### Cards
*   Cards should not have backgrounds different from the main surface unless they are intended to pop. Use a 1px border (`#DDD7CA` at 10% opacity) to define the card's perimeter. Ensure padding inside cards is generous (min 32px).

### Lists
*   List items are separated by 1px horizontal rules (10% Parchment opacity). 
*   Use `mono-label` for numerical data or dates within lists to create a technical, "ledger" feel.

### Selection Controls (Checkboxes/Radios)
*   Strictly square (0px radius). When checked, they fill with the Terracotta accent and use the Deep Charcoal color for the checkmark icon.