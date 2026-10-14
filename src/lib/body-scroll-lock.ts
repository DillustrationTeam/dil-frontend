// Each open dialog owns a lock; cleanup order must not affect restoration.
const locks = new Set<symbol>();
let previousOverflow = '';

export function acquireBodyScrollLock(): () => void {
  if (locks.size === 0) previousOverflow = document.body.style.overflow;
  const owner = Symbol('dialog');
  locks.add(owner);
  document.body.style.overflow = 'hidden';
  return () => {
    if (!locks.delete(owner)) return;
    if (locks.size === 0) document.body.style.overflow = previousOverflow;
  };
}
