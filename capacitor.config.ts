import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.gcm.biritinga",
  appName: "SIG-GCM Biritinga",
  webDir: "public",
  server: {
    url: "https://sig-gcm-biritinga-7z5f.vercel.app",
    cleartext: false,
  },
};

export default config;