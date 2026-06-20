import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.imagetransformer.ai.app',
  appName: 'Image Transformer AI',
  webDir: 'public',
  server: {
    // This wraps your live web application (with working API routes) into the Android WebView
    url: 'https://ais-pre-im7hgyk7a6pyrc6aotq4z4-822790960391.asia-east1.run.app',
    cleartext: true
  }
};

export default config;
