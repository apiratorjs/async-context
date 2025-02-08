export type TContexStoreName = any;

export type TNamedContextArgs<TCallbackResult> = [TContexStoreName, any, () => Promise<TCallbackResult> | TCallbackResult];

export type TFullContextArgs<TCallbackResult> = [AsyncContextStore, () => Promise<TCallbackResult> | TCallbackResult];

export class AsyncContextStore extends Map<TContexStoreName, any> {
  public static fromObject(obj: Record<string, any>): AsyncContextStore {
    const store = new AsyncContextStore();

    for (const [key, value] of Object.entries(obj)) {
      store.set(key, value);
    }

    return store;
  }

  public toPlain(): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const [key, value] of this.entries()) {
      obj[key] = value;
    }
    return obj;
  }
}
