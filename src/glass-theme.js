// Shared optical settings for homepage and tools; dark glass stays subdued.
export const getGlassTheme = (dark) => ({
  frost: 0.08,
  dispersion: 0,
  specular: dark ? 0.24 : 0.85,
  profile: 'squircle',
});
