# Dhatu-Scan Design System

## Purpose & Context
Premium healthcare AI PWA for early detection of child malnutrition. Dark mode, privacy-focused, accessible for parents, caregivers, and health workers in low-connectivity environments.

## Tone & Differentiation
Futuristic but human-centered. Trust through clarity, not complexity. Glassmorphism cards convey transparency and softness. Floating particles suggest gentle growth and care. No harsh edges or aggressive CTA styling.

## Color Palette

| Token | OKLCH | Usage |
|-------|-------|-------|
| Primary | 0.7 0.18 180 | CTAs, focus states, interactive elements |
| Secondary | 0.65 0.16 160 | Supporting actions, secondary hierarchy |
| Accent | 0.72 0.19 170 | Highlights, badges, emphasis |
| Success | 0.75 0.14 100 | Healthy status, good assessments |
| Warning | 0.55 0.12 350 | At-risk indicators, caution |
| Muted | 0.2 0 0 | Disabled, secondary text |
| Background | 0.08 0 0 | Page base (dark) |
| Card | 0.12 0 0 | Component base with 10% white overlay |

## Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display | General Sans | 700 | Headings, hero text, badges |
| Body | DM Sans | 400-600 | Body text, form labels, descriptions |
| Mono | Geist Mono | 400 | Code, data values, scores |

## Shape Language
- Radius: 12px (lg), 10px (md), 8px (sm) for consistency across buttons, cards, inputs
- Corners intentionally rounded (no sharp edges) to convey warmth in healthcare context
- Avatar badges use full circles (rounded-full)

## Structural Zones

| Zone | Background | Border | Treatment |
|------|------------|--------|-----------|
| Header/Nav | card (0.12 0 0) | border/white-10 | Subtle glass effect, bottom border |
| Main Content | background (0.08 0 0) | none | Gradient accent blobs, floating particles |
| Card Components | card (0.12 0 0) + white/5 | white/10 | Glass effect with backdrop blur |
| Footer | muted/40 | border/top | Reduced visual weight |
| Sidebar (desktop) | card (0.12 0 0) | border/right | Glass effect matching nav |
| Bottom Nav (mobile) | card (0.12 0 0) | border/top | Floating appearance with shadow |

## Elevation & Depth
- No harsh shadows; use soft 20% black at 4px-12px blur for depth
- Glass effect: white/5 overlay + backdrop-blur-md + white/10 border
- Card-elevated: shadow-lg shadow-black/20
- Staggered z-layers for nav > modals > floating elements

## Spacing & Rhythm
- Base unit: 4px (Tailwind default)
- Padding: 16px (cards), 20px (sections), 24px (page margins on desktop)
- Gap between cards: 16px
- Mobile-first: 16px padding, scale up to 24px on lg screens

## Component Patterns
- Buttons: glass-effect with smooth transition on hover, no outline shadows
- Cards: consistent glass treatment with optional gradient accent border (accent/50 to transparent)
- Forms: input fields inherit card styling with white/10 border
- Charts: use chart tokens (1-5) for Recharts data visualization
- Status indicators: color-coded badges with soft glow (opacity pulse)

## Motion & Animation
- Page transitions: Framer Motion fadeInUp (0.6s ease-out)
- Card reveal: staggered children (0.1s delay each)
- Loading: pulse-gentle (2s) on placeholder content
- Camera scan: scan-pulse (1.5s) on detection overlay
- Floating elements: float keyframe (3s ease-in-out)
- CTA hover: scale-105 + transition-smooth (0.3s)

## Responsive Breakpoints
- Mobile (sm): 16px padding, bottom nav, full-width cards
- Tablet (md): 20px padding, sidebar collapse option
- Desktop (lg+): 24px padding, fixed sidebar, grid layouts

## Dark Mode
Primary palette: teal/cyan accents on near-black backgrounds (0.08L). Maintains AA+ contrast with text at 0.96L. Border tones at 0.22L provide subtle separation without harsh lines.

## Key Implementation Rules
1. OKLCH values only in CSS variables; never mix color systems
2. Semantic token names (primary, accent, muted, etc.) used in components
3. No arbitrary color classes (bg-[#hex]) in component code
4. Gradients defined as CSS variables for reuse
5. Animations orchestrated via Framer Motion; Tailwind utilities for micro-interactions
6. Chart colors use chart-1 through chart-5 tokens (already vibrant for data viz)
7. Accessibility: min contrast ratio AA (0.7 L difference foreground-background)

## Signature Detail
Floating particle background on landing page + assessment pages. Subtle gradient accent strokes on card borders (accent/50 to transparent). Health status presented as circular gauges with soft color coding. Loading states use skeleton cards with pulse-gentle animation, maintaining glass effect appearance.
