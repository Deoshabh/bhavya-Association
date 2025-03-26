# Bhavya Association Tailwind CSS Migration Guide

This guide provides instructions for developers working on the Bhavya Association frontend project to adopt the new centralized Tailwind CSS approach.

## Table of Contents

1. [Introduction](#introduction)
2. [Component Styling Approach](#component-styling-approach)
3. [How to Refactor Components](#how-to-refactor-components)
4. [Available Component Classes](#available-component-classes)
5. [Theme Configuration](#theme-configuration)
6. [Development Workflow](#development-workflow)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Introduction

We are migrating from direct Tailwind CSS classes in components to a more centralized approach using component classes defined in `components.css`. This approach offers several benefits:

- Improved maintainability
- Consistent styling
- Reduced duplication
- Better developer experience

## Component Styling Approach

Our new approach uses three layers:

1. **Theme Configuration**: Defined in `tailwind.config.js`
2. **Component Classes**: Defined in `components.css` using @apply
3. **Component-Specific Styling**: Applied in React components

## How to Refactor Components

### Step 1: Identify Common Patterns

Look for repeated Tailwind class combinations in your component:

```jsx
// Before
<button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors">
  Click Me
</button>
```

### Step 2: Use Component Classes

Replace with appropriate component classes:

```jsx
// After
<button className="btn btn-primary">
  Click Me
</button>
```

### Step 3: Add Component-Specific Styles

For component-specific styling, you can add additional classes:

```jsx
<button className="btn btn-primary mt-4 ml-2">
  Click Me
</button>
```

## Available Component Classes

### Button Components

- `.btn`: Base button styles
- `.btn-primary`: Primary button styles
- `.btn-secondary`: Secondary button styles
- `.btn-outline`: Outline button styles

### Card Components

- `.card`: Base card styles
- `.card-hover`: Card with hover effects
- `.card-header`: Card header section
- `.card-body`: Card body section
- `.card-footer`: Card footer section

### Form Components

- `.form-group`: Form group container
- `.form-label`: Form label
- `.form-input`: Form input field
- `.form-error`: Form error message

### And many more...

Refer to `components.css` for the complete list of available component classes.

## Theme Configuration

Our theme is configured in `tailwind.config.js` and includes:

- Color palette: primary, secondary, neutral, etc.
- Spacing scale
- Typography
- Shadows
- Animations

Use theme values where possible instead of hardcoded values.

## Development Workflow

1. Check if a component class already exists for your use case
2. If not, consider adding a new component class to `components.css`
3. Use the TestComponents page to verify styling

## Testing

Use the TestComponents page (`/test-components`) to verify that components look as expected after refactoring.

## Troubleshooting

### Common Issues

1. **Component looks different after refactoring**
   - Check if all styling is properly captured in component classes
   - Verify that you're using the correct component classes

2. **CSS not applying**
   - Check for CSS specificity issues
   - Ensure components.css is properly imported

3. **Conflicts with existing styles**
   - Use `!important` sparingly to override conflicting styles
   - Consider refactoring the conflicting styles

### Getting Help

If you encounter issues not covered in this guide, please reach out to the frontend team lead.

---

This guide is a living document and will be updated as we progress with the migration.
