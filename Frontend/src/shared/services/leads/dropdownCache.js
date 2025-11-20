// Dropdown data cache to avoid refetching on every modal open
// This dramatically improves modal opening speed

class DropdownCache {
  constructor() {
    this.cache = {};
    this.cacheTimestamps = {};
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  get(key) {
    const timestamp = this.cacheTimestamps[key];
    if (!timestamp) return null;
    
    const age = Date.now() - timestamp;
    if (age > this.CACHE_DURATION) {
      // Cache expired
      delete this.cache[key];
      delete this.cacheTimestamps[key];
      return null;
    }
    
    return this.cache[key];
  }

  set(key, value) {
    this.cache[key] = value;
    this.cacheTimestamps[key] = Date.now();
  }

  clear() {
    this.cache = {};
    this.cacheTimestamps = {};
  }

  // Get multiple keys at once
  getMultiple(keys) {
    const result = {};
    const missing = [];
    
    for (const key of keys) {
      const cached = this.get(key);
      if (cached) {
        result[key] = cached;
      } else {
        missing.push(key);
      }
    }
    
    return { cached: result, missing };
  }
}

// Singleton instance
const dropdownCache = new DropdownCache();

export default dropdownCache;

