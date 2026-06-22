import { Geolocation } from "@capacitor/geolocation";

export async function obterLocalizacao() {
  const posicao = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
  });

  return {
    latitude: posicao.coords.latitude,
    longitude: posicao.coords.longitude,
    velocidade: posicao.coords.speed || 0,
    precisao: posicao.coords.accuracy,
  };
}