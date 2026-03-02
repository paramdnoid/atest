// THREE.Clock was deprecated in r171 in favor of THREE.Timer, but
// @react-three/fiber <=9.x still uses it internally. Suppress the
// console warning until R3F ships a stable release with the fix.
const _warn = console.warn;
if (
  !(console.warn as unknown as { __threeClockPatched?: boolean })
    .__threeClockPatched
) {
  const patched = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    _warn.apply(console, args);
  };
  (patched as unknown as { __threeClockPatched: boolean }).__threeClockPatched =
    true;
  console.warn = patched;
}
