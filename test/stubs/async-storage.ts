// In-memory stand-in for @react-native-async-storage/async-storage.
// lib/query/client.ts constructs the persister at module scope, so simply
// importing it in a test pulls this module in. Nothing here is exercised
// by the current suite -- it exists so the import resolves under Node.
const store = new Map<string, string>();

const AsyncStorage = {
  getItem: async (key: string) => store.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: async (key: string) => {
    store.delete(key);
  },
  clear: async () => {
    store.clear();
  },
};

export default AsyncStorage;
