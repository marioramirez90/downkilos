import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.marioramirez.downkilos',
  appName: 'Down Kilos',
  webDir: 'dist/down-kilos/browser',
  server: {
    androidScheme: 'https',
    cleartext: false
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#15803D'
    }
  }
};

export default config;
