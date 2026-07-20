"use client";

export type UsuarioAcidentesCat = { id: string | number; nome: string; perfil: string; municipio_id: number };
export const TIPOS_EVENTO = ["ACIDENTE_COM_AFASTAMENTO","ACIDENTE_SEM_AFASTAMENTO","INCIDENTE_OPERACIONAL","QUASE_ACIDENTE"] as const;
export const GRAVIDADES = ["LEVE","MODERADA","GRAVE","FATAL"] as const;
export function normalizarAcidentesCat(v: unknown){return String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toUpperCase().replace(/[\s-]+/g,"_")}
export function lerUsuarioAcidentesCat(): UsuarioAcidentesCat | null {if(typeof window==="undefined") return null;try{const d=JSON.parse(localStorage.getItem("usuarioLogado")||"null");if(!d?.id||!d?.municipio_id)return null;return{id:d.id,nome:String(d.nome||"Usuário"),perfil:normalizarAcidentesCat(d.perfil),municipio_id:Number(d.municipio_id)}}catch{return null}}
export function podeGerenciarAcidentesCat(p:string){return ["DESENVOLVEDOR","ADMIN","COMANDANTE","DIRETOR","CMT_GUARNICAO"].includes(normalizarAcidentesCat(p))}
export function formatarAcidentesCat(v:unknown){return String(v??"").replaceAll("_"," ").toLowerCase().replace(/(^|\s)\S/g,l=>l.toUpperCase())}
export function formatarDataAcidentesCat(v?:string|null){if(!v)return"—";const [a,m,d]=v.slice(0,10).split("-");return d&&m&&a?`${d}/${m}/${a}`:v}
