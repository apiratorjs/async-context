# AsyncContext

A small utility library for managing asynchronous, request-scoped context data via node:async_hooks’s AsyncLocalStorage.

AsyncContext helps you store and retrieve context data (such as user info, correlation IDs, configuration, etc.) in
asynchronous flows without passing context objects through every function.

## Installation

```bash
npm i @apiratorjs/async-context
```

if you are using yarn:

```bash
yarn add @apiratorjs/async-context
```

## Overview

AsyncContext internally uses Node.js’s AsyncLocalStorage from the node:async_hooks module to maintain context data
across asynchronous boundaries. This allows you to avoid manually passing context objects in deeply nested function
calls.
Key points:

* Non-intrusive: Wraps your callback in a new async context scope seamlessly.
* Flexible: Choose between merging data (e.g., adding or updating fields in existing context) or overriding data
  entirely.
* TypeScript-friendly: Written in TypeScript with full type definitions.
