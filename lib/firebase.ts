import { initializeApp, getApps } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export async function obterMessaging() {
  const suportado = await isSupported();

  if (!suportado) return null;

  return getMessaging(app);
}