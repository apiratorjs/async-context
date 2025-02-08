import { describe, it } from "node:test";
import assert from "node:assert";
import { AsyncContext } from "../src/async-context";

describe("AsyncContext", () => {
  it("withContext Overload 1 merges under a named key", async () => {
    await AsyncContext.withContext("user", { id: 123 }, () => {
      assert.strictEqual(AsyncContext.isInContext(), true);
      assert.deepStrictEqual(AsyncContext.getContext("user"), { id: 123 });
    });

    assert.strictEqual(AsyncContext.isInContext(), false);
  });

  it("withContext Overload 2 merges partial context", async () => {
    await AsyncContext.withContext({ user: { id: 1 }, config: { mode: "dark" } }, () => {
      assert.strictEqual(AsyncContext.isInContext(), true);
      assert.deepStrictEqual(AsyncContext.getContext("user"), { id: 1 });
      assert.deepStrictEqual(AsyncContext.getContext("config"), { mode: "dark" });
    });
  });

  it("withContextOverride Overload 1 overrides sub-context under a name", async () => {
    await AsyncContext.withContext("user", { id: 123, name: "Alice" }, async () => {
      await AsyncContext.withContextOverride("user", { id: 9999 }, () => {
        assert.deepStrictEqual(AsyncContext.getContext("user"), { id: 9999 });
      });
    });
  });

  it("withContextOverride Overload 2 overrides multiple keys", async () => {
    await AsyncContext.withContext({ user: { id: 42 }, session: { token: "abc" } }, async () => {
      await AsyncContext.withContextOverride({ user: { id: 999 }, session: { token: "xyz" } }, () => {
        assert.deepStrictEqual(AsyncContext.getContext("user"), { id: 999 });
        assert.deepStrictEqual(AsyncContext.getContext("session"), { token: "xyz" });
      });
    });
  });

  it("getContext with no arguments returns entire context", async () => {
    await AsyncContext.withContext({ a: 1, b: 2 }, () => {
      const entire = AsyncContext.getContext();
      assert.deepStrictEqual(entire, { a: 1, b: 2 });
    });
  });

  it("getContext with a single string argument returns one key", async () => {
    await AsyncContext.withContext({ a: 1, b: 2 }, () => {
      const valueA = AsyncContext.getContext("a");
      assert.strictEqual(valueA, 1);

      const valueB = AsyncContext.getContext("b");
      assert.strictEqual(valueB, 2);
    });
  });

  it("getContext with an array of keys returns partial context", async () => {
    await AsyncContext.withContext({ x: 10, y: 20, z: 30 }, () => {
      const partial = AsyncContext.getContext(["x", "z"]);
      assert.deepStrictEqual(partial, { x: 10, z: 30 });
    });
  });

  it("isInContext returns false outside of withContext / withContextOverride", () => {
    assert.strictEqual(AsyncContext.isInContext(), false, "Should be false when not in a context");
  });
});
