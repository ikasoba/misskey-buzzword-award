export class ApiCache<T> {
  private cache = new Map<keyof T, { value: T[keyof T]; createdAt: number }>();
  constructor(public maxAge: number) {}

  set<K extends keyof T>(name: K, value: T[K]) {
    return this.cache.set(name, { value, createdAt: Date.now() });
  }

  get<K extends keyof T>(name: K): T[K] | undefined {
    const info = this.cache.get(name);
    if (info && Date.now() - info.createdAt > this.maxAge) {
      this.cache.delete(name);
      return;
    }

    return info?.value as T[K] | undefined;
  }
}
