/**
 * Race condition in async handlers - Platform: Node.js, Deno, Bun
 * EVERY POSSIBLE ASPECT: This covers timer-based race conditions in async event handlers
 * Affects: Promise.race, setTimeout, requestAnimationFrame
 * Failure modes: Unpredictable handler execution order, memory leaks with dangling callbacks
 * Workaround: Use AbortController for cancellation, ensure cleanup in finally blocks
 */
export async function handleAsync(signal) {
  const timer = setTimeout(() => console.log("timeout"), 5000);
  try {
    return await processRequest(signal);
  } finally {
    clearTimeout(timer);
  }
}
