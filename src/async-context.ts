import { AsyncLocalStorage } from "node:async_hooks";
import { AsyncContextStore, TContexStoreName, TFullContextArgs, TNamedContextArgs } from "./types";
import { isPlainObject } from "./is-plain-object";

const alc = new AsyncLocalStorage<AsyncContextStore>();

export class AsyncContext {
  public static withContext<T>(...args: TNamedContextArgs<T>): Promise<T> | T
  public static withContext<T>(...args: TFullContextArgs<T>): Promise<T> | T
  public static withContext<T>(...args: TNamedContextArgs<T> | TFullContextArgs<T>): Promise<T> | T {
    if (args.length === 3) {
      const [name, context, callback] = args;
      return alc.run(AsyncContext.buildNamedContext(name, context), callback);
    }

    const [context, callback] = args;
    return alc.run(AsyncContext.buildContext(context, false), callback);
  }

  public static withContextOverride<T>(...args: TNamedContextArgs<T>): Promise<T> | T
  public static withContextOverride<T>(...args: TFullContextArgs<T>): Promise<T> | T
  public static withContextOverride<T>(...args: TNamedContextArgs<T> | TFullContextArgs<T>): Promise<T> | T {
    if (args.length === 3) {
      const [name, context, callback] = args;
      return alc.run(AsyncContext.buildNamedContext(name, context, true), callback);
    }

    const [context, callback] = args;
    return alc.run(AsyncContext.buildContext(context, true), callback);
  }


  public static getMultiContext(names: TContexStoreName[]): AsyncContextStore {
    names = names ?? [];

    const store: AsyncContextStore = alc.getStore() ?? new AsyncContextStore();
    const context: AsyncContextStore = new AsyncContextStore();

    for (const name of names) {
      if (store.has(name)) {
        context.set(name, store.get(name));
      }
    }

    return context;
  }

  public static getContext(): AsyncContextStore;
  public static getContext<T = any>(name?: TContexStoreName): T;
  public static getContext<T = any>(...args: TContexStoreName | void): AsyncContextStore | T {
    const store: AsyncContextStore = alc.getStore() ?? new AsyncContextStore();

    if (!args.length) {
      return store;
    }

    const name = args[0] as string;

    return name ? store.get(name) : store;
  }

  public static isInContext(): boolean {
    return !!alc.getStore();
  }

  private static buildNamedContext(name: TNamedContextArgs<any>, payload: any, shouldOverride?: boolean): AsyncContextStore {
    const prevContext: AsyncContextStore = alc.getStore() ?? new AsyncContextStore();
    const context: AsyncContextStore = new AsyncContextStore(prevContext);

    if (!prevContext.has(name)) {
      context.set(name, payload);
      return context;
    }

    if (shouldOverride) {
      context.set(name, payload);
    } else {
      // Merge if both are compatible
      const prevPayload = prevContext.get(name);

      // Detect if some keys of payload override the previous payload and warn about it
      if (isPlainObject(prevPayload) && isPlainObject(payload)) {
        Object.keys(payload).forEach((key: string) => {
          if (key in prevPayload) {
            console.log(`[${AsyncContext.name}] [INFO] Key "${key}" in context "${name}" is being overridden. Previous value:`, prevPayload[key], "New value:", payload[key]);
          }
        });
      } else if (prevPayload instanceof Map && payload instanceof Map) {
        const prevKeys = Array.from(prevPayload.keys());
        const newKeys = Array.from(payload.keys());

        newKeys.forEach((key: string) => {
          if (prevKeys.includes(key)) {
            console.log(`[${AsyncContext.name}] [INFO] Key "${key}" in context "${name}" is being overridden. Previous value:`, prevPayload.get(key), "New value:", payload.get(key));
          }
        });
      } else if (prevPayload instanceof Set && payload instanceof Set) {
        const prevValues = Array.from(prevPayload);
        const newValues = Array.from(payload);

        newValues.forEach((value: any) => {
          if (prevValues.includes(value)) {
            console.log(
              `[${AsyncContext.name}] [INFO] Value "${value}" in context "${name}" is being overridden. Previous set included:`, prevValues, "New set includes:", newValues);
          }
        });
      } else if (Array.isArray(prevPayload) && Array.isArray(payload)) {
        const prevKeys = Array.from(prevPayload);
        const newKeys = Array.from(payload);

        newKeys.forEach((key: string) => {
          if (prevKeys.includes(key)) {
            console.log(`[${AsyncContext.name}] [INFO] Key "${key}" in context "${name}" is being overridden. Previous value:`, prevPayload, "New value:", payload);
          }
        });
      } else {
        console.log(`[${AsyncContext.name}] [INFO] Value "${prevPayload}" in context "${name}" is being overridden. Previous value:`, prevPayload, "New value:", payload);
      }

      // Merge the payload with the previous payload
      if (isPlainObject(prevPayload) && isPlainObject(payload)) {
        context.set(name, { ...prevPayload, ...payload });
      } else if (prevPayload instanceof Map && payload instanceof Map) {
        context.set(name, new Map([...prevPayload, ...payload]));
      } else if (prevPayload instanceof Set && payload instanceof Set) {
        context.set(name, new Set([...prevPayload, ...payload]));
      } else if (Array.isArray(prevPayload) && Array.isArray(payload)) {
        context.set(name, [...prevPayload, ...payload]);
      } else {
        context.set(name, payload);
      }
    }

    return context;
  }


  private static buildContext(ctx: AsyncContextStore, shouldOverride: boolean): AsyncContextStore {
    const prevContext: AsyncContextStore = (alc.getStore() as AsyncContextStore) || new AsyncContextStore();
    const context: AsyncContextStore = new AsyncContextStore(prevContext);

    for (const [contextName, value] of ctx.entries()) {
      const builtContext = AsyncContext.buildNamedContext(contextName as TContexStoreName, value, shouldOverride);

      context.set(contextName, builtContext.get(contextName));
    }

    return context;
  }
}
