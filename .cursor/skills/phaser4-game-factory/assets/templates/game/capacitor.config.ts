import type { CapacitorConfig } from '@capacitor/cli';

// Per-game native config. Each game = distinct appId/appName (see references/00 & 02).
// Signing is injected from env in CI (references/04-ci-cd.md). Never commit server.url.
const config: CapacitorConfig = {
  appId: '__APP_ID__',        // e.g. com.studio.puzzle01  (reverse-DNS, unique per game)
  appName: '__APP_NAME__',    // e.g. Puzzle Quest
  webDir: 'dist',
  zoomEnabled: false,         // block pinch-zoom (default since Cap 6)
  android: {
    buildOptions: {
      keystorePath: process.env.KEYSTORE_PATH,
      keystorePassword: process.env.KEYSTORE_PASSWORD,
      keystoreAlias: process.env.KEYSTORE_ALIAS,
      keystoreAliasPassword: process.env.KEYSTORE_ALIAS_PASSWORD,
      releaseType: 'AAB',
    },
  },
  ios: {
    scheme: 'App',
    buildOptions: { signingStyle: 'manual', exportMethod: 'app-store-connect' },
  },
  plugins: {
    SystemBars: { hidden: true }, // fullscreen game; remove if you need the status bar
  },
};

export default config;
