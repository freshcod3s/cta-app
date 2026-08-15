// Brand tokens for runtime access (e.g. drawerActiveTintColor in
// @react-navigation/drawer screenOptions, which doesn't accept className).
// Mirrored from tailwind.config.js -- KEEP IN SYNC if hex values change.
// Source: https://congresstradealerts.com :root CSS custom properties.
export const ctaColors = {
  accent: "#6366f1",
  buy: "#10b981",
  sell: "#ef4444",
  late: "#f59e0b",
  dem: "#3b82f6",
  rep: "#ef4444",
  // Dark nav-chrome tokens (mirror content's tailwind gray-900/100/800) so the
  // React Navigation dark theme blends seamlessly with the dark content.
  darkBg: "#111827",
  darkText: "#f3f4f6",
  darkBorder: "#1f2937",
} as const;
