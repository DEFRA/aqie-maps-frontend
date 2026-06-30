# GDS Frontend Development Rules

## Team-Wide Standards

These rules apply to all frontend projects, not just individual applications. All frontend work must conform to the standards below regardless of project.

### GOV.UK Design System

All frontend UI must be built using [GOV.UK Design System](https://design-system.service.gov.uk/get-started/production/) components and patterns. Do not build custom UI components or patterns when an equivalent exists in the Design System.

- Use the Design System [components](https://design-system.service.gov.uk/components/), [patterns](https://design-system.service.gov.uk/patterns/), and [styles](https://design-system.service.gov.uk/styles/) as the first and default choice
- Only deviate from the Design System when there is a clear, documented reason (e.g. internal-only UI with no public-facing equivalent)
- Keep `govuk-frontend` up to date to receive accessibility fixes and new components

### Accessibility — WCAG 2.2 Level AA

All frontend work must meet [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/WAI/WCAG22/Understanding/) Level AA as a minimum.

Key criteria to enforce in all generated and reviewed code:

| Criterion                                                                                                     | Requirement                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [1.4.11 Non-text Contrast (AA)](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)           | UI components (inputs, buttons, focus indicators) and informational graphics must have a contrast ratio of at least 3:1 against adjacent colours |
| [1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)                 | Text must have a contrast ratio of at least 4.5:1 (3:1 for large text)                                                                           |
| [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)                         | Keyboard focus must always be visible                                                                                                            |
| [2.4.11 Focus Appearance (AA, new in 2.2)](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) | Focus indicators must meet minimum size and contrast requirements                                                                                |
| [4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)                     | Status and error messages must be programmatically determinable without receiving focus                                                          |

GOV.UK Design System components are built to meet these criteria by default. **Do not override Design System focus styles, colour tokens, or contrast values** — doing so is likely to introduce WCAG failures.

## AI Assistant Behavior

As an AI assistant creating a GDS compliant frontend you should:

- **Prioritize accessibility** and government standards in all suggestions
- **Use semantic search** to understand existing patterns before suggesting new code
- **Read existing files** to understand the current implementation before making changes
- **Follow the established folder structure** and naming conventions
- **Test suggestions** against GOV.UK Design System guidelines
- **Explain the reasoning** behind accessibility and content design choices
- **Suggest improvements** that align with user-centered design principles

## Project Overview

This project is the productionised frontend for the Defra Air Quality (AQIE) interactive map. It serves a full-screen interactive map allowing users to explore current air quality readings from monitoring stations across the UK. It is the production implementation of the patterns and features prototyped in `aqie-maps-prototype`.

Key features:

- **Interactive map** — full-screen map (powered by `@defra/interactive-map` and MapLibre) displaying monitoring station locations
- **Station information panel** — selecting a station displays its air quality readings and metadata
- **Pollutant filter panel** — users can filter the map display by pollutant type
- **Air quality forecasts** — forecast data fetched from `aqie-forecast-api`
- **Live measurements** — current readings fetched from `aqie-back-end`

The application:

- **For public users**: members of the public checking air quality near them
- **Department**: Department for Environment, Food and Rural Affairs (Defra)
- **Upstream services**: `aqie-back-end` (monitoring station data and measurements), `aqie-forecast-api` (forecasts)

## Technical Framework

- **Server-side**: Node.js and Hapi
- **Templating**: Nunjucks
- **UI Components**: GOV.UK Design System (`govuk-frontend`)
- **Mapping**: `@defra/interactive-map` with MapLibre GL as the map provider
- **Infrastructure**: Deployed on Defra's Core Delivery Platform (CDP)

## Folder Structure

```
[root]/
├── src/
│   ├── client/                    # Client-side assets
│   │   ├── javascripts/          # Client-side JavaScript
│   │   ├── stylesheets/          # CSS/SCSS files
│   │   └── common/               # Shared client resources
│   ├── server/                   # Server-side code
│   │   ├── common/               # Shared server resources
│   │   │   ├── components/       # Reusable Nunjucks components
│   │   │   ├── templates/        # Template structure
│   │   │   │   ├── layouts/      # Page layouts
│   │   │   │   └── partials/     # Partial templates
│   │   │   ├── helpers/          # Helper functions
│   │   │   └── constants/        # Configuration constants
│   │   ├── plugins/              # Hapi plugins (router, CSP, session, etc.)
│   │   │   └── router.js         # Route registration
│   │   ├── routes/               # Feature route modules
│   │   │   └── [feature-name]/   # One folder per feature
│   │   │       ├── index.js      # Plugin registration and route definitions
│   │   │       ├── controller.js # Route handlers (GET/POST controllers)
│   │   │       ├── controller.test.js  # Co-located unit tests
│   │   │       └── index.njk     # Nunjucks template
│   │   └── server.js             # Hapi server setup
│   ├── config/                   # Application configuration
│   └── index.js                  # Entry point
└── test-helpers/                 # Shared test utilities
```

Test files are **co-located** with the module they test (e.g. `controller.test.js` sits alongside `controller.js`). There is no separate root-level `test/` or `tests/` directory.

## Code Standards

### Templates

- Use Nunjucks macros from GOV.UK Design System
- Always include macro imports at the top of templates:
  ```nunjucks
  {% from "govuk/components/input/macro.njk" import govukInput %}
  {% from "govuk/components/button/macro.njk" import govukButton %}
  ```
- **Prefer Nunjucks over client-side HTML strings** — render static and initial UI server-side using Nunjucks macros rather than building HTML in JavaScript (e.g. via `innerHTML`). GDS component markup may change in future versions; server-side rendering means those updates are picked up automatically without rewriting JavaScript strings.
- **Client-side JavaScript should show, hide, and read DOM state** — not construct HTML. If dynamic content is needed, pre-render all possible states in the Nunjucks template (using `hidden` attributes) and use JavaScript only to toggle visibility.

### SCSS/Styling Standards

**Core Principle:** Maximize style reuse. Minimize new styles.

**Class Naming:**

- Custom classes: prefix with `app-`

**Styling Priority (Follow in Order):**

1. **Reuse existing app styles** - Always check first. Prefer consistency over perfect design match.
2. **Use GOV.UK Design System** - Search `node_modules/govuk-frontend` for applicable styles.
3. **Never create new styles** - ONLY as last resort. Requires user approval. Must use `app-` prefix.

**Rules:**

- Never rewrite or duplicate existing styles
- Add new styles only when absolutely necessary
- Seek explicit approval before creating any new `app-` classes
- Always extract and reuse hardcoded variables (e.g. colours & dimensions)

### JavaScript/TypeScript Standards

**Reference:** Follow the [Air Quality Team JavaScript Style Guide](javascript.md)

**Key Points:**

- Use ES modules (`import`/`export`), not CommonJS (`require`/`module.exports`)
- No semicolons at end of statements
- 2 spaces indentation, no tabs
- 80 character line length limit
- Use `const` by default, `let` when reassignment needed (no `var`)
- Single quotes for strings, template literals for interpolation
- Named exports only (no default exports)
- Function declarations over arrow functions (except for callbacks)
- Parentheses required around arrow function parameters
- Use neostandard for linting
- JSDoc comments for functions and classes (pragmatic approach)
- **Always use curly braces for `if` / `else` / `else if` blocks** — even for single-line bodies. Omitting braces is a common source of bugs when statements are added later.

  ```javascript
  // ✅ correct
  if (condition) {
    return value
  }

  // ❌ avoid
  if (condition) return value
  ```

**Testing:**

- Use Vitest for all JavaScript tests
- Test files are **co-located** with the module under test (e.g. `controller.test.js` alongside `controller.js`)
- File naming: `[module-name].test.js`

**Dependency Management:**

- Pin dependencies to exact versions in `package.json`
- No range specifiers (`^`, `~`)

### Formatting Standards

- Nunjucks templates: 2 spaces indentation, no tabs
- SCSS: 2 spaces indentation, no tabs

### Code Organization

- Define and reuse Nunjucks filters (e.g., `toMonth`, `toMoney`)
- Separate data from presentation

### Validation & Accessibility

- Return validation errors with `govukErrorSummary`
- Add per-field error items
- All code must meet WCAG 2.2 Level AA — see [Team-Wide Standards](#accessibility--wcag-22-level-aa) for specific criteria
- Follow Home Office accessibility poster guidance:
  - Colour contrast for text (4.5:1) and UI components (3:1) — WCAG 1.4.3 and **1.4.11**
  - Visible, sufficient focus styles — never remove or reduce Design System focus indicators
  - Error feedback announced via `aria-live`
  - All inputs properly labelled

### Content Design

- Follow GOV.UK style guide with adaptations for internal users:
  - Sentence case
  - ISO date format (e.g., "24 April 2025")
  - Clear, professional language (can use Defra-specific terminology)
  - No ampersands
  - Active voice
- Front-load key information
- One idea per sentence
- Address users directly using second person ("you")
- For internal services, you can:
  - Use technical terms and acronyms familiar to Defra staff
  - Be more concise where appropriate
  - Focus on task completion rather than extensive explanation

### UI Components

Use GOV.UK Design System components for:

- Form elements (inputs, checkboxes, radio buttons)
- Error messages and validation feedback
- Success messages and confirmation screens
- Navigation elements including phase banners
- Information display (tables, lists, alerts)
- Progress indicators and loading states

## Development Workflow

When working with this codebase:

- **Search existing patterns** before creating new components
- **Reuse established components** and layouts where possible
- **Test accessibility** with screen readers and keyboard navigation
- **Validate against** GOV.UK Design System documentation

## File Creation Guidelines

When creating:

- **New feature/page**: Create folder in `src/server/routes/[feature-name]/` containing:
  - `index.js` - Plugin registration and route definitions
  - `controller.js` - Route handlers (GET/POST controllers)
  - `controller.test.js` - Co-located unit tests for the controller
  - `[feature-name].njk` - Nunjucks template
  - Optional: `[feature-name]-api.js` for API calls, `[feature-name]-schema.js` for validation
- **New component**: Create folder in `src/server/common/components/[component-name]/` with component files
- **New layout**: Create file in `src/server/common/templates/layouts/[layout-name].njk`
- **New partial template**: Create file in `src/server/common/templates/partials/[partial-name].njk`
- **New helper function**: Create file in `src/server/common/helpers/[helper-name].js`
- **Register routes**: Import and register the plugin in `src/server/plugins/router.js`
- **Shared test utilities**: Add to `test-helpers/`

## Quality Checklist

Before suggesting any code changes, ensure:

- [ ] Accessibility requirements are met
- [ ] GOV.UK Design System components are used correctly
- [ ] Content follows government style guide
- [ ] Error handling and validation is implemented
- [ ] Code follows established patterns in the project
- [ ] Existing styles have been checked for reuse before creating new ones
