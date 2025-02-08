import { AsyncLocalStorage } from "node:async_hooks";
import { IContext } from "./types";
import { isPrimitive } from "./is-primitive";

const alc = new AsyncLocalStorage<IContext>();

export class AsyncContext {
  /**
   * Runs a callback within a new async context, merging new values into the current context.
   *
   * **Overload 1**
   * `withContext(name: string, ctx: IContext, callback: () => Promise<any> | any): Promise<any>`
   *
   * **Overload 2**
   * `withContext(ctx: Partial<IContext>, callback: () => Promise<any> | any): Promise<any>`
   *
   *  - **Overload 1**: The name of the context key to store
   *  - **Overload 2**: A partial context object that will be merged into the current context
   *
   *  - **Overload 1**: The context object to merge under the `name` key
   *  - **Overload 2**: The callback to execute within the newly created async context
   *
   * @param name {string}
   * @param ctx {IContext}
   * @param callback {() => Promise<any> | any}
   * @returns {Promise<any>} The result of the `callback` function.
   */
  public static async withContext(name: string, ctx: IContext, callback: () => Promise<any> | any): Promise<any>
  public static async withContext(ctx: Partial<IContext>, callback: () => Promise<any> | any): Promise<any>
  public static async withContext(...args: any[]): Promise<any> {
    if (args.length === 3) {
      const [name, context, callback] = args;
      return alc.run(AsyncContext.buildNamedContext(name, context), callback);
    }

    const [context, callback] = args;
    return alc.run(AsyncContext.buildContext(context, false), callback);
  }

  /**
   * Similar to `withContext` but any existing context data under the same key(s) is overridden rather than merged.
   *
   * **Overload 1**
   * `withContextOverride(name: string, ctx: IContext, callback: () => Promise<any> | any): Promise<any>`
   *
   * **Overload 2**
   * `withContextOverride(ctx: Partial<IContext>, callback: () => Promise<any> | any): Promise<any>`
   *
   * - **Overload 1**: The name of the context key to store
   * - **Overload 2**: A partial context object that will be merged into the current context
   *
   * - **Overload 1**: The context object to merge under the `name` key
   * - **Overload 2**: The callback to execute within the newly created async context
   *
   * @param {string} name
   * @param {IContext} ctx
   * @param {() => Promise<any> | any} callback
   * @returns {Promise<any>} The result of the `callback` function.
   */
  public static async withContextOverride(name: string, ctx: IContext, callback: () => Promise<any> | any): Promise<any>
  public static async withContextOverride(ctx: Partial<IContext>, callback: () => Promise<any> | any): Promise<any>
  public static async withContextOverride(...args: any[]): Promise<any> {
    if (args.length === 3) {
      const [name, context, callback] = args;
      return alc.run(AsyncContext.buildNamedContext(name, context, true), callback);
    }

    const [context, callback] = args;
    return alc.run(AsyncContext.buildContext(context, true), callback);
  }


  /**
   * Retrieves the current async context, or specific parts of it.
   *
   * **Overload 1**
   * `getContext(): IContext`
   * Returns the entire context object.
   *
   * **Overload 2**
   * `getContext(name: string): IContext`
   * Returns the context object under the specified key.
   *
   * **Overload 3**
   * `getContext(name: string[]): IContext`
   * Returns a context object with the specified keys.
   *
   * @param {string | string[]} [name] The key or keys to retrieve from the context.
   * @returns {IContext} The context object or specific parts of it.
   */
  public static getContext(name?: string): IContext
  public static getContext(name?: string[]): IContext
  public static getContext(...args: any[]): IContext {
    const store = alc.getStore() ?? {};

    if (!args.length) {
      return store;
    }

    if (Array.isArray(args[0])) {
      const names = args[0] as string[];
      const context: IContext = {};

      for (const name of names) {
        context[name] = store[name];
      }

      return context;
    }

    const name = args[0] as string;

    return name ? store[name] : store;
  }

  /**
   * Checks if the code is currently running within a context created by `AsyncContext`.
   *
   * @returns {boolean} `true` if inside a context, otherwise `false`.
   */
  public static isInContext(): boolean {
    return !!alc.getStore();
  }

  /**
   * Builds a new context object, either merging or overriding the value of an existing context key.
   *
   * @private
   * @param {string} name - The key in the context to modify.
   * @param {IContext} ctx - The context value to merge or override.
   * @param {boolean} [shouldOverride=false] - If `true`, the old value is replaced entirely. If `false`, new is merged into existing.
   * @returns {IContext} A new context object with the merged or overridden value.
   */
  private static buildNamedContext(name: string, ctx: IContext, shouldOverride?: boolean): IContext {
    const prevContext = (alc.getStore() as IContext) ?? {};
    const context = { ...prevContext };

    if (shouldOverride) {
      context[name] = ctx;
    } else {
      context[name] = { ...prevContext[name], ...ctx };
    }

    return context;
  }

  /**
   * Builds a new context object from multiple context keys, either merging or overriding each key's value.
   *
   * @private
   * @param {IContext} ctx - The partial or full context object containing multiple keys to merge or override.
   * @param {boolean} shouldOverride - If `true`, the old value is replaced entirely for each key; if `false`, it’s merged.
   * @returns {IContext} A new context object with merged or overridden values for each key in `ctx`.
   */
  private static buildContext(ctx: IContext, shouldOverride: boolean): IContext {
    const prevContext: IContext = (alc.getStore() as IContext) || {};
    const context: IContext = { ...prevContext };

    for (const [contextName, value] of Object.entries(ctx)) {
      if (isPrimitive(value)) {
        context[contextName] = value;
        continue;
      }

      const builtContext = AsyncContext.buildNamedContext(contextName, value, shouldOverride);
      context[contextName] = { ...context[contextName], ...builtContext[contextName] };
    }

    return context;
  }
}
