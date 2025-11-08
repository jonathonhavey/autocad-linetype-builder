# LineType Builder - Complete Theme Customization Guide

## Overview
The LineType Builder theme system allows you to customize **every color** in the application through a single JSON file: `data/theme.json`. The system supports both **light** and **dark** modes with independent color tokens for each.

## Theme Structure

The `theme.json` file contains two main objects:
```json
{
  "light": { /* light mode color tokens */ },
  "dark": { /* dark mode color tokens */ }
}
```

## Complete Token Reference

### Global/Body Tokens
- **metaColor** - Browser chrome/tab color (mobile)
- **bodyBg** - Page background color
- **bodyText** - Default text color throughout the page
- **panelBg** - Background for main panels (design, preview, output sections)
- **panelShadow** - Shadow color for panel depth

### Card System
- **cardBg** - Background of individual element cards
- **cardBorder** - Default border color for cards
- **cardsBgContainer** - Background of the cards container area
- **cardHoverBorder** - Border color when hovering over a card
- **cardDragBorder** - Border color when dragging a card
- **cardDragBg** - Background when dragging over the cards container
- **cardContent** - Text color inside card content areas
- **cardTypeSelectorText** - Color of the card type dropdown text
- **cardTypeSelectorHover** - Color when hovering over card type selector
- **dragHandleText** - Color of the drag handle icon

### Header
- **headerBg** - Site header background (can use gradients)
- **headerText** - Main heading and subtitle text color in header
- **sectionHeaderText** - Section heading text color
- **sectionHeaderBorder** - Border color under section headings

### Buttons - Action Types
- **primaryBtn** - Background for success/primary action buttons
- **primaryBtnHover** - Hover state for primary buttons
- **primaryBtnText** - Text color on primary buttons
- **secondaryBtn** - Background for secondary buttons
- **secondaryBtnHover** - Hover state for secondary buttons
- **dangerBtn** - Background for delete/dangerous actions
- **dangerBtnHover** - Hover state for danger buttons
- **infoBtn** - Background for info/help buttons
- **infoBtnHover** - Hover state for info buttons

### Toolbar Buttons
- **toolbarBtn** - Background for toolbar action buttons
- **toolbarBtnHover** - Hover state for toolbar buttons
- **toolbarBtnText** - Text color on toolbar buttons

### Form Inputs
- **inputBg** - Background for text/number inputs and textareas
- **inputBorder** - Border color for inputs
- **inputBorderFocus** - Border color when input is focused
- **inputText** - Text color inside inputs
- **selectBg** - Background for select dropdowns
- **selectText** - Text color in select dropdowns
- **selectBorder** - Border color for select dropdowns

### Number Controls
- **numberBtnBg** - Background for number increment/decrement buttons
- **numberBtnHover** - Hover state for number buttons
- **numberBtnActive** - Active/pressed state for number buttons
- **numberBtnText** - Text color on number buttons

### Links
- **linkText** - Color for hyperlinks
- **linkHover** - Color when hovering over links

### Modals
- **modalBg** - Background for modal dialogs
- **modalOverlay** - Semi-transparent overlay behind modals
- **modalBorder** - Border color around modal dialogs
- **modalText** - Text color inside modals
- **modalCloseText** - Color of the close button
- **modalCloseHover** - Close button hover color

### Help Menu
- **helpMenuBg** - Background of the help dropdown menu
- **helpMenuBorder** - Border color around help menu
- **helpMenuText** - Text color in help menu
- **helpItemHover** - Background when hovering over help items

### Symbol Menu
- **symbolMenuBg** - Background of the symbol picker menu
- **symbolMenuBorder** - Border around symbol menu
- **symbolMenuText** - Text color in symbol menu
- **symbolItemBg** - Background of individual symbol items
- **symbolItemHover** - Background when hovering over symbols
- **symbolItemHoverBorder** - Border when hovering over symbols

### Zoom Controls
- **zoomBtnBg** - Background for zoom in/out buttons
- **zoomBtnBorder** - Border color for zoom buttons
- **zoomBtnHoverBorder** - Border when hovering over zoom buttons
- **zoomBtnHoverBg** - Background when hovering over zoom buttons

### Output Section
- **outputBg** - Background for the output/code display
- **outputBorder** - Border around output area
- **outputText** - Text color in output area
- **outputErrorBg** - Background for error messages
- **outputErrorBorder** - Border for error messages
- **outputErrorText** - Text color for errors

### Import Bar
- **importBarBg** - Background for the import notification bar
- **importBarBorder** - Border for import bar
- **importBarText** - Text color in import bar
- **importBarCloseBtnText** - Close button text color
- **importBarCloseBtnHover** - Close button hover background

### Error Banner
- **errorBannerBg** - Background for critical error banners
- **errorBannerText** - Text color in error banners

### Expand Controls
- **expandBtnBg** - Background for expand/collapse buttons
- **expandBtnHover** - Hover state for expand buttons
- **expandBtnText** - Text color on expand buttons
- **expandPanelBg** - Background of expanded panels

### Helper Buttons
- **centerBtnBg** - Background for "center canvas" helper button
- **centerBtnBorder** - Border for center button
- **centerBtnText** - Text color on center button
- **formatBtnBg** - Background for format/prettify button
- **formatBtnText** - Text color on format button

### Footer
- **footerBg** - Footer section background
- **footerText** - Default footer text color
- **footerH3** - Color for h3 headings in footer
- **footerPara** - Color for paragraph text in footer
- **footerH4** - Color for h4 headings in footer
- **footerLi** - Color for list items in footer
- **footerLiBefore** - Color for bullet points before list items
- **footerKeywordsBg** - Background for keywords section
- **copyright** - Color for copyright text

### Theme Toggle
- **themeSelectBg** - Background for the light/dark theme selector
- **themeSelectText** - Text color in theme selector
- **themeSelectBorder** - Border color for theme selector
- **themeSelectFocusBorder** - Border when theme selector is focused

### Preview Canvas
The `preview` object contains colors specific to the canvas rendering:
- **preview.bg** - Canvas background color
- **preview.content** - Color for line/shape rendering
- **preview.gridMinor** - Color for minor grid lines
- **preview.gridMajor** - Color for major grid lines

## Customization Examples

### High Contrast Light Mode
```json
"light": {
  "bodyBg": "#ffffff",
  "bodyText": "#000000",
  "primaryBtn": "#0066cc",
  "cardBg": "#f0f0f0",
  "cardBorder": "#333333"
}
```

### Pastel Dark Mode
```json
"dark": {
  "bodyBg": "#1a1625",
  "bodyText": "#e8d5ff",
  "primaryBtn": "#b794f6",
  "cardBg": "#2d1f3d",
  "headerBg": "linear-gradient(135deg, #3a2a4f 0%, #553d6f 100%)"
}
```

### Monochrome Theme
```json
"light": {
  "bodyBg": "#ffffff",
  "bodyText": "#000000",
  "panelBg": "#f5f5f5",
  "cardBg": "#eeeeee",
  "primaryBtn": "#666666",
  "dangerBtn": "#333333"
}
```

## Tips for Custom Themes

1. **Use Color Gradients**: The `headerBg` and `errorBannerBg` tokens support CSS gradients
2. **Maintain Contrast**: Ensure sufficient contrast between text and backgrounds for readability
3. **Test Both Modes**: Always test your customizations in both light and dark modes
4. **Use Transparency**: Tokens like `modalOverlay`, `panelShadow`, and grid colors support rgba() values
5. **Semantic Naming**: Button tokens are named by function (primary, danger, etc.) rather than color
6. **Preview Changes**: The canvas preview will update immediately when you modify and reload the theme

## How It Works

1. The app loads `data/theme.json` on startup
2. JavaScript generates CSS overrides dynamically based on your tokens
3. All tokens use `!important` to override default CSS values
4. Changes require a page reload to take effect
5. Theme preference (light/dark) is stored in localStorage

## Troubleshooting

**Colors not changing?**
- Verify your JSON syntax is valid
- Check that token names match exactly (case-sensitive)
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

**Some elements look wrong?**
- Ensure you've set both background AND text colors for contrast
- Check that border colors complement their backgrounds
- Verify gradient syntax if using linear-gradient()

**Want to reset to defaults?**
- Copy the original `theme.json` values back
- Or delete custom values to fall back to CSS defaults
