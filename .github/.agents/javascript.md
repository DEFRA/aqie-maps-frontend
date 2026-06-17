---
layout: default
title: JavaScript Style Guide
---

# JavaScript Style Guide

This page outlines the style guide / coding conventions for JavaScript code within the Defra Air Quality team.

This guide is an extension to the [Defra JavaScript Standards](https://defra.github.io/software-development-standards/standards/javascript_standards/) and is intended to be used in conjunction with it.

## Table of Contents

- [1 JavaScript Project Rules](#1-javascript-project-rules)
  - [1.1 Linting / Formatting](#11-linting--formatting)
  - [1.2 Module System](#12-module-system)
    - [1.2.1 Imports](#121-imports)
    - [1.2.2 Exports](#122-exports)
  - [1.3 Testing](#13-testing)
    - [1.3.1 Mocking](#131-mocking)
  - [1.4 Node.js Version](#14-nodejs-version)
    - [1.4.1 .nvmrc Configuration](#141-nvmrc-configuration)
  - [1.5 Dependency Management](#15-dependency-management)
    - [1.5.1 Dependency Updates](#151-dependency-updates)
    - [1.5.2 .npmrc Configuration](#152-npmrc-configuration)
    - [1.5.3 Security Scanning](#153-security-scanning)
  - [1.6 Documentation](#16-documentation)
- [2 JavaScript Style Guide](#2-javascript-style-guide)
  - [2.1 Source Files](#21-source-files)
    - [2.1.1 File Naming](#211-file-naming)
    - [2.1.2 Formatting](#212-formatting)
    - [2.1.3 Indentation](#213-indentation)
    - [2.1.4 Semicolons](#214-semicolons)
    - [2.1.5 Line Length Limit](#215-line-length-limit)
  - [2.2 Variable Declarations](#22-variable-declarations)
    - [2.2.1 No Magic Numbers](#221-no-magic-numbers)
  - [2.3 Functions](#23-functions)
    - [2.3.1 Function Declarations](#231-function-declarations)
    - [2.3.2 Function Expressions](#232-function-expressions)
    - [2.3.3 Parameters](#233-parameters)
    - [2.3.4 Object Method Definition](#234-object-method-definition)
    - [2.3.5 Async/Await](#235-asyncawait)
  - [2.4 Strings](#24-strings)
    - [2.4.1 String Literals](#241-string-literals)
    - [2.4.2 Template Literals](#242-template-literals)
  - [2.5 Classes](#25-classes)
  - [2.6 Error Handling](#26-error-handling)
- [Contributions](#contributions)

## 1 JavaScript Project Rules

### 1.1 Linting / Formatting

The Defra JavaScript Standards enforces using ESLint using only [neostandard](https://github.com/neostandard/neostandard) as the only linter of choice. Therefore, all code in your project should follow the neostandard rules.

All ESLint rules enabled in neostandard by default can be found [here](https://eslint.style/rules), however, key rules are highlighted below.

Linting and formatting checks must be run before committing code. Projects should configure [Husky](https://typicode.github.io/husky/) to enforce this automatically via a pre-commit hook. The `git:pre-commit-hook` script in `package.json` runs `npm run format:check`, `npm run lint`, and `npm test` before each commit. To set up Husky, run `npm run setup:husky`.

### 1.2 Module System

Use ES modules for JavaScript code. Each module should be defined in its own file, and the file name should match the module name.

#### 1.2.1 Imports

All module imports should use ES `import` syntax and not CommonJS `require` syntax. The import statements should be placed at the top of the file, before any other code.

All imports should be at the top of the file, and they should be grouped in the following order alphabetically:

1. External libraries
2. Internal modules

Do this:

```javascript
import Hapi from '@hapi/hapi'

import myModule from './my-module.js'
```

Don't do this:

```javascript
const Hapi = require('@hapi/hapi')

const myModule = require('./my-module.js')
```

#### 1.2.2 Exports

All module exports should use ES `export` syntax and not CommonJS `module.exports`. The export statements should be placed at the bottom of the file, after all other code.

Always use named exports, default exports are not allowed.

Do this:

```javascript
function myFunction() {
  // function code
}

export { myFunction }
```

Don't do this:

```javascript
export default function myFunction() {
  // function code
}

// or this
module.exports = function myFunction() {
  // function code
}
```

### 1.3 Testing

We use [Vitest](https://vitest.dev/) for testing JavaScript code. All tests should be placed in the same directory as the file they are testing and not in a separate `tests` directory at the root of the project. Each test file should be named after the module it tests, with a `.test.js` suffix.

Test files should be placed in the same directory as the module under test.

The primary focus should be **unit tests**, targeting a minimum of **90% code coverage**. Integration tests should be written where required, for example when testing interactions between multiple modules or external services, but should not be the default approach.

#### 1.3.1 Mocking

When mocking dependencies in tests, if not using dependency injection, you should use the `vi.mock()` function provided by Vitest. You should not use any other mocking library such as `sinon` or `jest.mock()`.

You should also only mock dependencies that the team owns or has control over. If a dependency is an external library, you should not mock it unless absolutely necessary. In these cases, you should consider using a integration test instead of a unit test.

### 1.4 Node.js Version

All new JavaScript projects should target the current active LTS version of Node.js (currently Node 24) to ensure compatibility with the latest features and security updates. If you are maintaining an existing project that targets an older version of Node.js, you should consider upgrading to the latest LTS version as soon as possible.

We recommend using [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm) to manage Node.js versions on development machines. This allows developers to easily switch between different versions of Node.js for different projects.

#### 1.4.1 .nvmrc Configuration

All projects should include a `.nvmrc` file at the root of the project with the Node.js version specified. This helps to ensure that all developers are using the same version of Node.js and can help to avoid compatibility issues.

```
v24.14.1
```

### 1.5 Dependency Management

All project dependencies must be managed using the `package.json` file. Use `npm` commands to add, update, or remove dependencies to ensure that the `package.json` file is kept up to date.

Ensure that you pin dependencies to specific versions to avoid unexpected issues due to version changes. Do not use range specifiers (`^`, `~`, etc.) and only pin to exact versions.

```jsonc
// Do this
{
  "name": "my_project",
  "version": "0.1.0",
  "dependencies": {
    "@hapi/hapi": "4.17.1",
    "eslint": "3.20.2"
  }
}

// Not this
{
  "name": "my_project",
  "version": "0.1.0",
  "dependencies": {
    "@hapi/hapi": "^4.17.1",
    "eslint": "^3.20.2"
  }
}
```

#### 1.5.1 Dependency Updates

Do not update to the latest cutting edge version of a dependency unless absolutely necessary (e.g. to fix a critical security vulnerability). Always prefer updating to a stable version that has been available for a reasonable amount of time.

#### 1.5.2 .npmrc Configuration

All projects must include an `.npmrc` file at the root of the project with the following configuration:

```
save-exact=true
ignore-scripts=true
```

`save-exact=true` ensures that all dependencies are pinned to exact versions when added to the `package.json` file.
`ignore-scripts=true` prevents the execution of lifecycle scripts when running npm commands. Lifecycle scripts have been exploited in recent supply chain attacks, so this setting helps to mitigate that risk.

> [!NOTE]
> Some packages with native bindings (e.g. `esbuild`, `sharp`) require lifecycle scripts to run correctly. If a package fails to install or build due to this setting, explicitly allowlist it using [npm script overrides](https://docs.npmjs.com/cli/v11/using-npm/scripts#script-override) rather than disabling `ignore-scripts` globally.

#### 1.5.3 Security Scanning

All projects must regularly run `npm audit` and preferably other security scanning tools to identify and flag any known vulnerabilities in project dependencies. Any vulnerabilities found should be addressed promptly by updating or replacing the affected dependencies.

These audits should also be automated as part of our CI pipelines and nightly scheduled scans. See the following GitHub actions for an example of how to set this up:

- [check-pull-request.yml](https://github.com/DEFRA/aqie-maps-frontend/blob/main/.github/workflows/check-pull-request.yml)

### 1.6 Documentation

All functions, classes, and modules should be documented using JSDoc comments. However, you should take a pragmatic approach to using JSDocs. Only document what is necessary to understand the code, and avoid over-documenting.

For example, when creating a function or a class, you should document:

- The purpose of the function or class
- The parameters it takes, including their types and descriptions
- The return value, including its type and description
- Any exceptions that may be thrown

You must avoid writing overly verbose comments that do not add value or are self-explanatory from the code itself. The goal is to make the code more understandable, not to repeat what is already clear.

Likewise, you should also avoid using JSDocs to document owners or versioning information, as this information is not relevant to the code itself and can be easily tracked using version control systems like Git.

Do this:

```javascript
/**
 * Adds two numbers together.
 *
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The sum of the two numbers.
 */
function add(a, b) {
  return a + b
}
```

Don't do this:

```javascript
/**
 * This function adds two numbers together.
 * It takes two parameters, a and b, which are both numbers.
 * It returns the sum of the two numbers.
 *
 * @author John Doe
 * @version 1.0
 * @since 2023-10-01
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The sum of the two numbers.
 */
function add(a, b) {
  return a + b
}
```

## 2 JavaScript Style Guide

### 2.1 Source Files

#### 2.1.1 File Naming

All source files should be UTF-8 encoded and have a `.js` extension. The file name must also be in kebab-case, which is a lower-case name with words separated by hyphens. For example, `my-awesome-file.js`.

The file name should be descriptive of the module's purpose and functionality. Avoid using abbreviations or acronyms unless they are widely recognised.

For example, a good file name for a server module might be `server.js`, while a bad file name might be `s.js` or `initialise.js`.

#### 2.1.2 Formatting

Code formatting is enforced using [Prettier](https://prettier.io/). Run `npm run format` to auto-format files, or `npm run format:check` to check formatting without making changes.

#### 2.1.3 Indentation

All code blocks should be indented with 2 spaces. Tabs are not allowed.

#### 2.1.4 Semicolons

No semicolons should be used at the end of statements.

Do this:

```javascript
function myFunction() {
  console.log('Hello, world!')
}
```

Don't do this:

```javascript
function myFunction() {
  console.log('Hello, world!')
}
```

#### 2.1.5 Line Length Limit

The maximum line length is 80 characters. Lines should be wrapped or refactored to fit within this limit.

### 2.2 Variable Declarations

All variables should be declared using `const` by default. If a variable needs to be reassigned, use `let`. Using var is not allowed.

Do this:

```javascript
const myVariable = 'Hello, world!'

// or this
let myVariable

myVariable = 'Hello, world!'
```

Don't do this:

```javascript
var myVariable = 'Hello, world!'
```

#### 2.2.1 No Magic Numbers

Do not use unexplained numeric (or string) literals directly in logic. Assign them to a named `const` that communicates their meaning.

Do this:

```javascript
const maxRetries = 3
const timeoutMs = 5000

if (attempts > maxRetries) {
  throw new Error('Max retries exceeded')
}
```

Don't do this:

```javascript
if (attempts > 3) {
  throw new Error('Max retries exceeded')
}
```

Exceptions: `0`, `1`, and `-1` are acceptable in clearly self-evident contexts (e.g. array indexing, incrementing, guard clauses). All other literals should be named.

### 2.3 Functions

#### 2.3.1 Function Declarations

In general, function declarations should be used instead of function expressions (aka anonymous or arrow functions).

Essentially, if the function needs to be called by name, use a function declaration.

If the function is only used as a callback, use an arrow function.

Do this:

```javascript
function myFunction() {
  // function code
}
```

Don't do this:

```javascript
const myFunction = function () {
  // function code
}

// or this
const myFunction = () => {
  // function code
}
```

#### 2.3.2 Function Expressions

An exception to the rule of using function declarations is when the function is only being used as a callback or to handle an event, in which case a function expression is acceptable.

Essentially, if a function needs to be called by name, use a function declaration. If the function is only used as a callback, use a function expression.

Acceptable use of an arrow function:

```javascript
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

// or
test('my test', () => {
  // test code
})
```

#### 2.3.3 Parameters

When using arrow functions, parentheses are required around the parameters, even if there is only one parameter.

Do this:

```javascript
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})
```

Don't do this:

```javascript
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})
```

#### 2.3.4 Object Method Definition

When defining methods inside objects, use the method definition syntax.

Do this:

```javascript
const entity = {
  test: 'hello world',
  register() {
    // method code
  }
}
```

Don't do this:

```javascript
const entity = {
  test: 'hello world',
  register: function () {
    // method code
  },
  another: () => {
    // method code
  }
}
```

#### 2.3.5 Async/Await

Always use `async/await` over `.then()/.catch()` Promise chains. This makes asynchronous code easier to read, reason about, and debug.

Do this:

```javascript
async function fetchData(url) {
  try {
    const response = await fetch(url)
    const data = await response.json()
    return data
  } catch (error) {
    throw new Error(`Failed to fetch data: ${error.message}`)
  }
}
```

Don't do this:

```javascript
function fetchData(url) {
  return fetch(url)
    .then((response) => response.json())
    .catch((error) => {
      throw new Error(`Failed to fetch data: ${error.message}`)
    })
}
```

An exception is when running multiple independent async operations concurrently, in which case `Promise.all()` is appropriate:

```javascript
const [users, posts] = await Promise.all([getUsers(), getPosts()])
```

### 2.4 Strings

#### 2.4.1 String Literals

All strings should use single quotes (`'`) for string literals. Double quotes (`"`) are not allowed.

#### 2.4.2 Template Literals

Template literals should be used for multi-line strings or when string interpolation is required. For simple strings, use single quotes.

### 2.5 Classes

In general, classes are not used instead, export standalone functions from modules or use factory functions to create objects.

If a class is necessary, e.g. you need to encapsulate state or share a dependency instance across methods, then you should use ES6 style classes. The class name should be in PascalCase, and the file name should match the class name in kebab-case.

Do this:

```javascript
class MyClass {
  constructor() {
    this.myProperty = 'Hello, world!'
  }

  myMethod() {
    console.log(this.myProperty)
  }
}
```

Don't do this:

```javascript
class myClass {
  constructor() {
    this.myProperty = 'Hello, world!'
  }

  myMethod() {
    console.log(this.myProperty)
  }
}

// or this
class MyClass {
  static myStaticMethod() {
    console.log('This is a static method')
  }
}
```

### 2.6 Error Handling

Always throw and reject with `Error` objects rather than plain strings or other values. This ensures stack traces are preserved and errors can be properly caught and inspected.

Do this:

```javascript
throw new Error('Something went wrong')

// or, for more specific error types:
throw new TypeError('Expected a string, got a number')
```

Don't do this:

```javascript
throw 'Something went wrong'

// or
throw { message: 'Something went wrong' }
```

When catching errors, always access the `error.message` property for the human-readable message rather than stringifying the whole error:

```javascript
try {
  await riskyOperation()
} catch (error) {
  logger.error(`Operation failed: ${error.message}`)
}
```
