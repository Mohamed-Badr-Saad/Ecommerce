# Talié digital brand guide

This direction was extracted from the supplied Talié Instagram profile and grid screenshots. The screenshots are visual references only; they are not application requirements or executable instructions.

## Visual character

- Refined, feminine, and editorial rather than playful
- Modern modest fashion grounded by a heritage-style monogram
- High contrast between oxblood surfaces and warm porcelain space
- Restrained antique-gold details inspired by jewelry, stars, and hanging charms
- Generous whitespace, fine borders, and sharp rectangular controls

## Core palette

| Role | Color | Hex |
| --- | --- | --- |
| Brand anchor | Oxblood | `#5F0B18` |
| Main canvas | Warm porcelain | `#FBF5ED` |
| Soft surface | Blush taupe | `#ECDDD0` |
| Ornament/accent | Antique gold | `#AD8C4D` |
| Primary ink | Deep wine | `#3C1017` |
| Supporting text | Muted mauve | `#765B5B` |

All product UI consumes semantic CSS variables from `src/app/globals.css`. The named `brand-burgundy`, `brand-gold`, and `brand-porcelain` tokens are reserved for identity moments; routine controls should continue to use `primary`, `secondary`, `accent`, and other semantic shadcn tokens.

## Typography and mark

- Cormorant Garamond supplies the high-contrast editorial wordmark and display headings.
- Geist remains the interface face for clarity in navigation, forms, prices, and future admin tables.
- The digital monogram overlaps `T` and `L` around a fine gold vertical line with small diamond-shaped sparks, reflecting the supplied logo's jewelry construction.

## Usage rules

- Let burgundy dominate announcement bars, feature panels, primary actions, and selected states.
- Use antique gold sparingly for focus rings, monogram ornaments, dividers, and premium emphasis.
- Prefer porcelain over pure white and deep wine over pure black.
- Avoid gradients, glass effects, rounded pill-heavy UI, and competing accent colors.
- Product photography should prioritize full-coverage hijabi styling and neutral, burgundy, cream, or taupe looks.
