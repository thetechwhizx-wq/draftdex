---
name: Bauhaus
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#343535'
  on-surface: '#e4e2e2'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#e4e2e2'
  inverse-on-surface: '#303030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c8c6c5'
  primary: '#c8c6c5'
  on-primary: '#313030'
  primary-container: '#1a1a1a'
  on-primary-container: '#848282'
  inverse-primary: '#5f5e5e'
  secondary: '#ffb4a9'
  on-secondary: '#690002'
  secondary-container: '#a50005'
  on-secondary-container: '#ffaea3'
  tertiary: '#b6c4ff'
  on-tertiary: '#002780'
  tertiary-container: '#00144d'
  on-tertiary-container: '#5179ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdad5'
  secondary-fixed-dim: '#ffb4a9'
  on-secondary-fixed: '#410001'
  on-secondary-fixed-variant: '#930004'
  tertiary-fixed: '#dce1ff'
  tertiary-fixed-dim: '#b6c4ff'
  on-tertiary-fixed: '#001551'
  on-tertiary-fixed-variant: '#0039b3'
  background: '#131314'
  on-background: '#e4e2e2'
  surface-variant: '#343535'
typography:
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

# Design System

## Brand & Style
The design system adopts a neutral, high-contrast dark aesthetic characterized by robust typography, generous whitespace, and a serious, purposeful tone. The overarching style balances contemporary brutalist influences with refined modern minimalism, creating a clear and direct user experience that lets content take center stage.

## Colors
The color palette is anchored by a stark primary dark near-black (`#1a1a1a`) that establishes strong visual authority in a dark color mode environment. The secondary color is a striking accent red (`#e63b2e`) used for focused calls to action and critical feedback, while the tertiary color (`#0055ff`) provides vibrant interactive states. Neutral tones (`#4a4a4a`) ensure high-contrast, accessible typography and structural layouts.

## Typography
Typography creates a strong architectural hierarchy using **Space Grotesk** for punchy, structural headlines and labels, paired with **Inter** for exceptional legibility in body copy. Type scales are kept clean and purposeful to maintain high scanning efficiency across screen sizes.

## Layout & Spacing
A flexible fluid grid system governs the layout, utilizing structured 1.5rem gutters and 2rem outer margins. Spacing follows a consistent geometric scale to rhythmically separate content blocks and maintain airy, readable layouts across all form factors.

## Elevation & Depth
Elevation is expressed primarily through clean, low-contrast outlines and sharp structural lines rather than heavy drop shadows. Layering is achieved via surface tonal shifts in a dark theme, reinforcing the flat, modern architectural aesthetic.

## Shapes
The UI features a soft roundedness (`rounded-sm` to `rounded-md`, approximately 0.25rem to 0.5rem radius) on interactive elements like buttons and cards. This subtly softens the otherwise stark, high-contrast palette without sacrificing structural integrity.

## Components
- **Buttons:** Solid primary elements using `#1a1a1a` backgrounds with crisp, legible Space Grotesk labels. Secondary and text variants rely on clear borders and hover shifts.
- **Inputs:** Clean rectangular fields with subtle borders, utilizing Inter for user input text and Space Grotesk for floating or helper labels.
- **Cards:** Structured surface containers bounded by clean, thin outlines and soft interior padding.
- **Badges & Chips:** Compact containers utilizing accent colors to highlight statuses or tags.