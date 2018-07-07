import asyncHooks = require("async_hooks");

/**
 * Enable the async hook
 */
export const enable = () => hooks.enable();

/**
 * Disable the async hook & clears all object stored
 */
export const disable = () => {
  hooks.disable();
  map.clear();
};

/**
 * Get the size of map
 */
export const size = () => map.size;

/**
 * Set the key/value for this score
 * @param {String} key The key of value
 * @param {String} value The value
 */
export function set(key: string, value: any) {
  const id = asyncHooks.executionAsyncId();
  let data = map.get(id);
  if (!data) {
    data = {};
    map.set(id, data);
  }
  data[key] = value;
}

/**
 * Get the value by key
 * @param {String} key The key of value
 */
export function get(key: string) {
  const id = asyncHooks.executionAsyncId();
  const data = map.get(id) || {};
  return data[key];
}

const map = new Map();

const hooks = asyncHooks.createHook({
  /**
   * Sets the parent's context as the current context
   */
  init: function init(asyncId: number, type: string, triggerAsyncId: number) {
    const parentContext = map.get(triggerAsyncId);
    if (parentContext) {
      // set parent context as current context
      map.set(asyncId, parentContext);
    }
  },

  /**
   * Remove the data
   */
  destroy: function destroy(asyncId: number) {
    if (map.has(asyncId)) {
      map.delete(asyncId);
    }
  }
});
enable();
