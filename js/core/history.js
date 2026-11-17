window.VT = window.VT || {};

/* VT.history — undo/redo framework (U5)
 * Snapshot controller for a tool's editable value. Coalescing is the caller's job
 * (typically a debounce on typing + explicit record() on programmatic changes).
 * Memory-only: never persisted, cleared on reset/unmount. Bounded stack (limit) so a
 * long editing session cannot grow without end.
 */
VT.history = (() => {
  function create(opts) {
    opts = opts || {};
    const limit = Math.max(1, opts.limit || 100);
    const apply = opts.apply || (() => {});
    const eq = opts.equal || ((a, b) => a === b);
    let current;
    let hasCurrent = false;
    const undoStack = [];
    const redoStack = [];

    function reset(value) {
      current = value;
      hasCurrent = true;
      undoStack.length = 0;
      redoStack.length = 0;
    }

    function record(value) {
      if (hasCurrent && eq(value, current)) return false;
      if (hasCurrent) {
        undoStack.push(current);
        if (undoStack.length > limit) undoStack.shift();
      }
      current = value;
      hasCurrent = true;
      redoStack.length = 0;
      return true;
    }

    function undo() {
      if (!undoStack.length) return false;
      redoStack.push(current);
      current = undoStack.pop();
      apply(current);
      return true;
    }

    function redo() {
      if (!redoStack.length) return false;
      undoStack.push(current);
      current = redoStack.pop();
      apply(current);
      return true;
    }

    // keydown handler; returns true when it consumed the event
    function onKey(e) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return false;
      const k = (e.key || '').toLowerCase();
      if (k === 'z' && !e.shiftKey) { if (undo()) { e.preventDefault(); return true; } return false; }
      if ((k === 'z' && e.shiftKey) || k === 'y') { if (redo()) { e.preventDefault(); return true; } return false; }
      return false;
    }

    return {
      reset, record, undo, redo, onKey,
      canUndo: () => undoStack.length > 0,
      canRedo: () => redoStack.length > 0,
      depth: () => ({ undo: undoStack.length, redo: redoStack.length }),
      limit
    };
  }

  return { create };
})();
