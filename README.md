# @apiratorjs/async-context

[![NPM version](https://img.shields.io/npm/v/@apiratorjs/async-context.svg)](https://www.npmjs.com/package/@apiratorjs/async-context)
[![License: MIT](https://img.shields.io/npm/l/@apiratorjs/async-context.svg)](https://github.com/apiratorjs/async-context/blob/main/LICENSE)

A lightweight Node.js library for managing asynchronous contexts using the built-in [`node:async_hooks`](https://nodejs.org/api/async_hooks.html) module. This package allows you to share, merge, and override context data throughout your asynchronous code execution. It’s especially useful for per-request or per-transaction state management, logging, and debugging.

> **Note:** Requires Node.js version **>=16.4.0**

---

## Features

- **Async Context Management:** Seamlessly pass context data across asynchronous calls.
- **Context Merging:** Automatically merge context data for common data types (plain objects, arrays, Maps, and Sets).
- **Context Overriding:** Override existing context data when needed.
- **Typed Context Store:** Built with TypeScript to provide type safety.
- **Easy Integration:** Works out-of-the-box with Node.js asynchronous operations.

---

## Installation

Install the package via npm:

```bash
npm install @apiratorjs/async-context
```

Or using yarn:

```bash
yarn add @apiratorjs/async-context
```

## Usage

### Basic Example
Use withContext to run a callback within an asynchronous context:

```typescript
import { AsyncContext } from "@apiratorjs/async-context";

async function main() {
  await AsyncContext.withContext("user", { id: 123 }, () => {
    // Inside this callback the context is available.
    const user = AsyncContext.getContext("user");
    console.log("User Context:", user); // { id: 123 }
  });
}

main();
```

### Merging Context
If you nest context calls using the same key, the package will merge the data if they are compatible (e.g., plain objects, arrays, Maps, or Sets):

```typescript
import { AsyncContext } from "@apiratorjs/async-context";

AsyncContext.withContext("config", { theme: "dark" }, () => {
  console.log(AsyncContext.getContext("config")); // { theme: "dark" }
  
  AsyncContext.withContext("config", { language: "en" }, () => {
    console.log(AsyncContext.getContext("config")); // { theme: "dark", language: "en" }
  });
});
```

### Overriding Context
Use withContextOverride to completely override a value in the context rather than merging:

```typescript
import { AsyncContext } from "@apiratorjs/async-context";

AsyncContext.withContext("user", { id: 123, name: "Alice" }, () => {
  AsyncContext.withContextOverride("user", { id: 999 }, () => {
    console.log(AsyncContext.getContext("user")); // { id: 999 }
  });
});
```

### Working with Multiple Keys
You can work with multiple context keys at once by passing an AsyncContextStore. For example:

```typescript
import { AsyncContext, AsyncContextStore } from "@apiratorjs/async-context";

// Create a context store from a plain object.
const contextStore = AsyncContextStore.fromObject({
  user: { id: 1 },
  session: { token: "abc" }
});

AsyncContext.withContext(contextStore, () => {
  const user = AsyncContext.getContext("user");
  const session = AsyncContext.getContext("session");
  console.log("User:", user);       // { id: 1 }
  console.log("Session:", session); // { token: "abc" }
});
```

### Retrieving Context Data
* Entire Context: Call AsyncContext.getContext() with no arguments.
* Specific Key: Call AsyncContext.getContext("key") to get the value associated with that key.
* Partial Context: Use AsyncContext.getMultiContext(["key1", "key2"]) to obtain a subset of the context.

```typescript
// Get the entire context store.
const store = AsyncContext.getContext();

// Get a specific context value.
const user = AsyncContext.getContext("user");

// Get a partial context containing selected keys.
const partialStore = AsyncContext.getMultiContext(["user", "session"]);
```

## Running Tests
To run the tests locally:
1. Clone the repository.
2. Install the dependencies using `npm install` or `yarn install`.
3. Run the tests using `npm test` or `yarn test`.
