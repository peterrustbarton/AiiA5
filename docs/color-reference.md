# AiiA UI Color Reference

This document provides a comprehensive overview of all colors used in the AiiA application, including their definitions, usage, and locations.

## Color System Overview

The AiiA application uses a combination of:
1. **CSS Custom Properties (CSS Variables)** - Defined in `app/globals.css`
2. **Tailwind CSS Configuration** - Extended in `tailwind.config.ts`
3. **Direct Hex Values** - Used in specific components
4. **Tailwind Utility Classes** - Standard and custom color classes

## CSS Variables (Primary Color System)

All primary colors are defined as HSL values in `app/globals.css` at `:root`:

| Variable | HSL Value | Usage | Description |
|----------|-----------|-------|-------------|
| `--background` | `222 47% 11%` | Main app background | Dark blue-gray background |
| `--foreground` | `210 40% 96%` | Primary text color | Light gray text |
| `--card` | `222 47% 14%` | Card backgrounds | Slightly lighter than main background |
| `--card-foreground` | `210 40% 96%` | Card text color | Same as foreground |
| `--popover` | `222 47% 14%` | Popover backgrounds | Same as card |
| `--popover-foreground` | `210 40% 96%` | Popover text | Same as foreground |
| `--primary` | `190 95% 55%` | Primary brand color | Bright cyan/turquoise |
| `--primary-foreground` | `222 47% 11%` | Text on primary | Dark background color |
| `--secondary` | `222 47% 16%` | Secondary elements | Slightly lighter gray |
| `--secondary-foreground` | `210 40% 96%` | Secondary text | Light gray |
| `--muted` | `222 47% 16%` | Muted backgrounds | Same as secondary |
| `--muted-foreground` | `215 20% 65%` | Muted text | Medium gray |
| `--accent` | `190 95% 55%` | Accent color | Same as primary |
| `--accent-foreground` | `222 47% 11%` | Accent text | Dark background |
| `--destructive` | `0 80% 65%` | Error/danger color | Red |
| `--destructive-foreground` | `210 40% 96%` | Error text | Light gray |
| `--border` | `222 47% 16%` | Border color | Same as secondary |
| `--input` | `222 47% 16%` | Input backgrounds | Same as secondary |
| `--ring` | `190 95% 55%` | Focus rings | Same as primary |
| `--success` | `140 60% 55%` | Success color | Green |
| `--warning` | `45 100% 70%` | Warning color | Yellow |

## Tailwind Configuration

The Tailwind config (`tailwind.config.ts`) extends the default theme with custom colors that reference the CSS variables:

```typescript
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: {
    DEFAULT: 'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))',
  },
  // ... (all other variables mapped similarly)
  chart: {
    '1': 'hsl(var(--chart-1))',
    '2': 'hsl(var(--chart-2))',
    '3': 'hsl(var(--chart-3))',
    '4': 'hsl(var(--chart-4))',
    '5': 'hsl(var(--chart-5))',
  },
}
```

## Direct Hex Color Values

These hex colors are used directly in component styling:

| Hex Color | RGB Equivalent | Usage | Location |
|-----------|----------------|-------|----------|
| `#0B1426` | `rgb(11, 20, 38)` | Modal backgrounds | `trade-confirmation-modal.tsx`, `trade-entry-modal.tsx` |
| `#1E293B` | `rgb(30, 41, 59)` | Card backgrounds, hover states | `trade-confirmation-modal.tsx`, `trade-entry-modal.tsx` |
| `#334155` | `rgb(51, 65, 85)` | Borders, separators | `trade-confirmation-modal.tsx`, `trade-entry-modal.tsx` |

## Special Color Effects

### Gradients

1. **Text Gradient** (defined in `globals.css`):
   ```css
   .text-gradient {
     background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
     -webkit-background-clip: text;
     -webkit-text-fill-color: transparent;
   }
   ```

2. **Glass Effect** (defined in `globals.css`):
   ```css
   .glass-effect {
     backdrop-filter: blur(16px);
     background: rgba(255, 255, 255, 0.1);
   }
   ```

3. **Account Tier Gradients** (in `account-tier-badge.tsx`):
   - Admin: `bg-gradient-to-r from-purple-500 to-pink-500`
   - Pro: `bg-gradient-to-r from-blue-500 to-cyan-500`

## Most Frequently Used Color Classes

Based on usage analysis, the most common color classes are:

| Class | Usage Count | Purpose |
|-------|-------------|---------|
| `text-white` | 23+ | White text on dark backgrounds |
| `text-muted-foreground` | 22+ | Secondary/muted text |
| `text-gray-300` | 22+ | Light gray text |
| `text-gray-400` | 13+ | Medium gray text |
| `text-primary` | 8+ | Primary brand color text |
| `bg-muted` | 8+ | Muted background areas |
| `text-accent-foreground` | 7+ | Text on accent backgrounds |
| `bg-accent` | 7+ | Accent background areas |

## Color Usage by Component Type

### Backgrounds
- **Main App**: `bg-background` (CSS variable)
- **Cards**: `bg-card`, `bg-[#1E293B]` (direct hex)
- **Modals**: `bg-[#0B1426]` (direct hex)
- **Inputs**: `bg-input` (CSS variable)

### Text Colors
- **Primary Text**: `text-foreground`, `text-white`
- **Secondary Text**: `text-muted-foreground`, `text-gray-300`, `text-gray-400`
- **Brand Text**: `text-primary`
- **Success/Error**: `success-color`, `error-color` (custom classes)

### Borders
- **Standard Borders**: `border-border` (CSS variable)
- **Card Borders**: `border-[#334155]` (direct hex)
- **Input Borders**: `border-input` (CSS variable)

### Interactive Elements
- **Buttons**: Use primary, secondary, and destructive color schemes
- **Hover States**: Often use `hover:bg-[#1E293B]` or `hover:bg-accent`
- **Focus States**: Use `ring` color for focus indicators

## File Locations Summary

### Primary Color Definitions
- **CSS Variables**: `app/globals.css` (lines 7-26)
- **Tailwind Config**: `tailwind.config.ts` (lines 23-61)

### Component-Specific Colors
- **Trade Modals**: `components/trade-confirmation-modal.tsx`, `components/trade-entry-modal.tsx`
- **Account Badges**: `components/account-tier-badge.tsx`
- **Charts**: `components/price-chart.tsx` (uses success/destructive variables)

### Utility Classes
- **Custom Classes**: `app/globals.css` (lines 60-104)
- **Animation Classes**: `app/globals.css` (lines 44-49)

## Theme System

The application uses `next-themes` for theme management, with the theme provider configured in `components/theme-provider.tsx`. The current implementation appears to use a single dark theme, but the infrastructure supports multiple themes.

## Recommendations

1. **Consistency**: Most colors follow the CSS variable system, but some components use direct hex values. Consider migrating all colors to use CSS variables for better maintainability.

2. **Documentation**: The three direct hex colors (`#0B1426`, `#1E293B`, `#334155`) could be added as CSS variables for better semantic naming.

3. **Chart Colors**: The chart color variables (`--chart-1` through `--chart-5`) are defined in Tailwind config but their actual HSL values are not set in the CSS variables.

4. **Color Accessibility**: Ensure all color combinations meet WCAG accessibility guidelines for contrast ratios.
