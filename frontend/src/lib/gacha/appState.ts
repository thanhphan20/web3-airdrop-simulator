function writable<T>(initial: T) {
  let value = initial;
  const subscribers = new Set<(v: T) => void>();
  return {
    get value() { return value; },
    set(v: T) { value = v; subscribers.forEach(cb => cb(v)); },
    update(fn: (v: T) => T) { value = fn(value); subscribers.forEach(cb => cb(value)); },
    subscribe(cb: (v: T) => void) { subscribers.add(cb); cb(value); return () => subscribers.delete(cb); }
  };
}

export const course = writable({ selected: null, point: 0 });
export const chronicledCourse = writable({ selected: null, type: null, point: 0 });
export const beginnerRemaining = writable(20);
export const showBeginner = writable(true);