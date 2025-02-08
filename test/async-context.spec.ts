import { describe, it } from "node:test";
import assert from "node:assert";
import { AsyncContext, AsyncContextStore } from "../src";

describe("AsyncContext", () => {
  it("withContext Overload 1 merges under a named key (plain object)", async () => {
    await AsyncContext.withContext("user", { id: 123 }, () => {
      assert.strictEqual(AsyncContext.isInContext(), true);
      assert.deepStrictEqual(AsyncContext.getContext("user"), { id: 123 });
    });
    assert.strictEqual(AsyncContext.isInContext(), false);
  });

  it("withContext Overload 2 merges partial context (plain object)", async () => {
    const asyncCtxStore = AsyncContextStore.fromObject({ user: { id: 1 }, config: { mode: "dark" } });
    await AsyncContext.withContext(asyncCtxStore, () => {
      assert.strictEqual(AsyncContext.isInContext(), true);
      assert.deepStrictEqual(AsyncContext.getContext("user"), { id: 1 });
      assert.deepStrictEqual(AsyncContext.getContext("config"), { mode: "dark" });
    });
  });

  it("withContextOverride Overload 1 overrides sub-context under a name (plain object)", async () => {
    await AsyncContext.withContext("user", { id: 123, name: "Alice" }, async () => {
      await AsyncContext.withContextOverride("user", { id: 9999 }, () => {
        assert.deepStrictEqual(AsyncContext.getContext("user"), { id: 9999 });
      });
    });
  });

  it("withContextOverride Overload 2 overrides multiple keys (plain object)", async () => {
    const asyncCtxStore = AsyncContextStore.fromObject({ user: { id: 42 }, session: { token: "abc" } });
    await AsyncContext.withContext(asyncCtxStore, async () => {

      const asyncCtxStore2 = AsyncContextStore.fromObject({ user: { id: 999 }, session: { token: "xyz" } });
      await AsyncContext.withContextOverride(asyncCtxStore2, () => {
        assert.deepStrictEqual(AsyncContext.getContext("user"), { id: 999 });
        assert.deepStrictEqual(AsyncContext.getContext("session"), { token: "xyz" });
      });
    });
  });

  it("getContext with no arguments returns entire context", async () => {
    const asyncCtxStore = AsyncContextStore.fromObject({ a: 1, b: 2 });
    await AsyncContext.withContext(asyncCtxStore, () => {
      const entire = AsyncContext.getContext();
      assert.deepStrictEqual(entire.toPlain(), { a: 1, b: 2 });
    });
  });

  it("getContext with a single string argument returns one key", async () => {
    const asyncCtxStore = AsyncContextStore.fromObject({ a: 1, b: 2 });
    await AsyncContext.withContext(asyncCtxStore, () => {
      const valueA = AsyncContext.getContext("a");
      assert.strictEqual(valueA, 1);

      const valueB = AsyncContext.getContext("b");
      assert.strictEqual(valueB, 2);
    });
  });

  it("getMultiContext with an array of keys returns partial context", async () => {
    const asyncCtxStore = AsyncContextStore.fromObject({ x: 10, y: 20, z: 30 });
    await AsyncContext.withContext(asyncCtxStore, () => {
      const partial = AsyncContext.getMultiContext(["x", "z"]);
      assert.deepStrictEqual(partial.toPlain(), { x: 10, z: 30 });
    });
  });

  it("isInContext returns false outside of withContext / withContextOverride", () => {
    assert.strictEqual(AsyncContext.isInContext(), false, "Should be false when not in a context");
  });

  it("merges arrays in a named context", async () => {
    await AsyncContext.withContext("list", [1, 2, 3], async () => {
      assert.deepStrictEqual(AsyncContext.getContext("list"), [1, 2, 3]);

      await AsyncContext.withContext("list", [4, 5], () => {
        assert.deepStrictEqual(AsyncContext.getContext("list"), [1, 2, 3, 4, 5]);
      });
    });
  });

  it("merges Maps in a named context", async () => {
    const map1 = new Map<string, number>([["a", 1]]);
    const map2 = new Map<string, number>([["b", 2]]);
    await AsyncContext.withContext("map", map1, async () => {
      assert.deepStrictEqual([...AsyncContext.getContext("map")], [["a", 1]]);

      await AsyncContext.withContext("map", map2, () => {
        const mergedMap = AsyncContext.getContext("map") as Map<string, number>;
        assert.deepStrictEqual([...mergedMap.entries()], [["a", 1], ["b", 2]]);
      });
    });
  });

  it("merges Sets in a named context", async () => {
    const set1 = new Set([1, 2]);
    const set2 = new Set([3, 4]);
    await AsyncContext.withContext("set", set1, async () => {
      assert.deepStrictEqual([...AsyncContext.getContext("set")!].sort(), [1, 2]);

      await AsyncContext.withContext("set", set2, () => {
        const mergedSet = AsyncContext.getContext<Set<number>>("set");
        assert.deepStrictEqual([...mergedSet].sort(), [1, 2, 3, 4]);
      });
    });
  });

  it("withContextOverride with arrays overrides instead of merging", async () => {
    await AsyncContext.withContext("list", [1, 2, 3], async () => {
      await AsyncContext.withContextOverride("list", [9, 9], () => {
        assert.deepStrictEqual(AsyncContext.getContext("list"), [9, 9]);
      });
    });
  });

  it("withContextOverride with Maps overrides instead of merging", async () => {
    const mapA = new Map<string, string>([["key", "old"]]);
    const mapB = new Map<string, string>([["key", "new"]]);
    await AsyncContext.withContext("map", mapA, async () => {
      await AsyncContext.withContextOverride("map", mapB, () => {
        const result = AsyncContext.getContext("map") as Map<string, string>;
        assert.deepStrictEqual([...result.entries()], [["key", "new"]]);
      });
    });
  });

  it("withContextOverride with Sets overrides instead of merging", async () => {
    const setA = new Set([1, 2]);
    const setB = new Set([3, 4]);
    await AsyncContext.withContext("set", setA, async () => {
      await AsyncContext.withContextOverride("set", setB, () => {
        const result = AsyncContext.getContext("set") as Set<number>;
        assert.deepStrictEqual([...result].sort(), [3, 4]);
      });
    });
  });
});
