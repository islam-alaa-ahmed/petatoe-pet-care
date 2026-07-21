import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.petatoe.enterprise',
  appName: 'PETATOE',
  webDir: 'www',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#07101c',
    allowsLinkPreview: false,
    scrollEnabled: true
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  }
};

export default config;
