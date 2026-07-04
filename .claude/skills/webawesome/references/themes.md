# Themes & Color Palettes

**Full documentation:** https://webawesome.com/docs/themes

## Applying Themes

Apply theme classes to the `<html>` element:

```html
<html class="wa-theme-awesome wa-palette-bright wa-brand-indigo">
```

For npm/CDN users, import the theme stylesheet:

```js
import '@awesome.me/webawesome/dist/styles/themes/awesome.css';
```

## Free Themes

| Theme | Description |
|-------|-------------|
| **Default** | The foundational theme using default design tokens |
| **Awesome** | Bright, vibrant color palette for modern interfaces |
| **Shoelace** | Classic Shoelace styling for familiarity |

## Color Palettes

Each palette provides 10 color hues with a scale of 11 tints.

### Free Palettes
- **Default** - Standard balanced hues
- **Bright** - Enhanced saturation
- **Shoelace** - Classic Shoelace colors

## Applying Palettes

```html
<html class="wa-palette-bright">
```

CSS variables follow the pattern `--wa-color-{hue}-{tint}`:

```css
.my-element {
  color: var(--wa-color-blue-60);
  background: var(--wa-color-gray-10);
}
```
