---
name: Midnight Tech-Forward
colors:
  surface: '#0f172a'
  surface-dim: '#0b1326'
  surface-bright: '#334155'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#1e293b'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bdc8d1'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#87929a'
  outline-variant: '#3e484f'
  surface-tint: '#7bd0ff'
  primary: '#8ed5ff'
  on-primary: '#00354a'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#00668a'
  secondary: '#b9c8de'
  on-secondary: '#233143'
  secondary-container: '#39485a'
  on-secondary-container: '#a7b6cc'
  tertiary: '#ffc176'
  on-tertiary: '#472a00'
  tertiary-container: '#f1a02b'
  on-tertiary-container: '#613b00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#d4e4fa'
  secondary-fixed-dim: '#b9c8de'
  on-secondary-fixed: '#0d1c2d'
  on-secondary-fixed-variant: '#39485a'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb960'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
  border-low: '#1e293b'
  border-high: '#334155'
  text-primary: '#f1f5f9'
  text-secondary: '#94a3b8'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.03em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 16px
  margin: 24px
  sidebar-fixed: 240px
  sidebar-mini: 64px
---

## Brand & Style

The design system is engineered for high-precision technical environments, moving away from stark blacks into a sophisticated **Midnight Navy and Slate** spectrum. This evolution creates a UI that feels deeper and more intentional, reducing visual fatigue while maintaining a high-fidelity, professional atmosphere.

The aesthetic blends **Minimalism** with **Modern-Technical** influences. It prioritizes data density and functional clarity, utilizing subtle tonal shifts to guide the user's eye. The emotional response is one of calm, focused authority—a "command center" feel where every pixel is deliberate and every interface element feels like a precision tool.

## Colors

The palette transitions from pure black to a nuanced **Midnight Navy** foundation. This provides a softer contrast ratio that is more comfortable for long-term usage while retaining a premium look.

- **Primary Accent:** The "Sky Blue" (`#38bdf8`) is the sole driver of attention. It is used for primary actions, active states, and critical feedback loops.
- **Surface Strategy:** The base application layer uses the Deep Midnight Navy (`#0f172a`). Elevated elements like cards and sidebars use the Slate Blue (`#1e293b`).
- **Tonal Depth:** Instead of standard grays, all neutrals are tinted with blue hues to ensure a cohesive, "tech-forward" temperature across the entire interface.
- **Interactive States:** Hover states should utilize a subtle lightening of the blue-tinted background (e.g., transitioning from Slate Blue to a slightly brighter `Slate 700`).

## Typography

This system employs a dual-font strategy to balance technical precision with extreme readability. **Geist** serves as the primary UI and display face, lending a monospaced-adjacent aesthetic that feels engineered. **Inter** is reserved for multi-line body text to ensure maximum legibility in data-heavy contexts.

Hierarchy is reinforced through tight line heights and negative letter spacing on larger headings. For metadata and category tags, use `label-sm` with all-caps styling to create a clear visual distinction from interactive UI labels.

## Layout & Spacing

The layout utilizes a **Fluid-Fixed Hybrid** model. Global navigation elements are anchored to fixed-width sidebars, while the primary content "Canvas" expands to fill the viewport.

- **Grid:** A 12-column fluid grid is used for dashboard layouts, allowing for flexible component placement.
- **Rhythm:** A strict 4px soft-grid governs all internal padding and margins, ensuring pixel-perfect alignment.
- **Density:** The design favors a high-density "tool" feel. Elements should be grouped tightly, using 1px borders rather than wide margins to define spatial boundaries.

## Elevation & Depth

Depth is established through **Tonal Layering** and **1px Outlines**, avoiding heavy shadows to maintain a clean, flat aesthetic.

- **Level 0 (Base):** Deep Midnight Navy (`#0f172a`). This is the canvas.
- **Level 1 (Cards/Sections):** Slate Blue (`#1e293b`) with a 1px border of `#334155`.
- **Level 2 (Floating/Modals):** A lighter slate variant with a refined, low-opacity (15%) shadow to provide separation from Level 1 surfaces.

A 1px "inner highlight" on the top edge of primary elements can be used to simulate a subtle light source from above, enhancing the tactile feel without breaking the minimalist vibe.

## Shapes

The design system uses a consistent **rounded-eight (8px)** philosophy, which translates to the "Rounded" setting (0.5rem). This provides a professional balance—neither too sharp nor too playful.

- **Inputs/Buttons:** Always use 0.5rem (8px).
- **Cards/Modals:** Use 0.75rem or 1rem for larger containers to create a nested visual rhythm.
- **Interactive Icons:** Small chips or status indicators should maintain the 0.5rem base radius to match the primary button language.

## Components

- **Buttons:** Primary buttons use the Sky Blue background with dark navy text for high contrast. Secondary buttons use a transparent background with a 1px Slate border.
- **Input Fields:** Backgrounds should be the base Deep Midnight Navy (creating a "sunken" effect within Slate cards). Borders should be `#334155`, glowing Sky Blue on focus.
- **Cards:** Defined by 1px borders (`#334155`) rather than shadows. The background is consistently Slate Blue (`#1e293b`).
- **Chips & Status:** Use a "Dot + Label" pattern. A 6px circular dot of the primary color next to a Geist label provides a cleaner look than a full-pill background.
- **Checkboxes/Radios:** Use the Sky Blue accent for checked states. Ensure the container has enough contrast against the Slate background.
- **Lists:** Use subtle 1px dividers between items. Drag-and-drop handles should be rendered as a 2x3 grid of dots to emphasize the technical "tooling" nature of the system.