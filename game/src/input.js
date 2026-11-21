// Keyboard and mouse input for The Lantern Thief.
// One clear job: turn raw key and click events into a small, stable
// state the game loop reads (move direction, sneak, and one-shot actions).
export function createInput() {
  const keys = new Set();
  const pressed = new Set(); // one-shot keys, consumed by the loop
  const listeners = [];

  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    if (!keys.has(key)) pressed.add(key);
    keys.add(key);
  }
  function onKeyUp(event) {
    keys.delete(event.key.toLowerCase());
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  listeners.push(['keydown', onKeyDown], ['keyup', onKeyUp]);

  return {
    // Held movement direction, normalised, or null when idle.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x === 0 && y === 0) return null;
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    sneaking() {
      return keys.has('shift');
    },
    // True once per physical press; the loop calls consume() each frame.
    wasPressed(key) {
      return pressed.has(key.toLowerCase());
    },
    consume() {
      pressed.clear();
    },
    destroy() {
      for (const [type, fn] of listeners) window.removeEventListener(type, fn);
    },
  };
}
