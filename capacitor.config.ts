import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.siggcmbrasil.app",
  appName: "SIG-GCM Brasil",
  webDir: "out",
  server: {
    url: "https://siggcmbrasil.com.br/sistema/mobile",
    cleartext: false,
  },
};

export default config;