import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sayanthrock.ai.app',
  appName: 'Sayanth Rock AI',
  webDir: 'public',
  server: {
    // This wraps your live web application (with working API routes) into the Android WebView
    url: 'https://ais-pre-im7hgyk7a6pyrc6aotq4z4-822790960391.asia-east1.run.app',
    cleartext: true
  }
};

export default config;
