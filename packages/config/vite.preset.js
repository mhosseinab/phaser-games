export function vitePreset(mode) {
  return {
    base: mode === 'native' ? './' : '/'
  };
}
