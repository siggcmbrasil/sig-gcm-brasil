"use client";
export type UsuarioCorregedoria={id:string|number;nome:string;perfil:string;municipio_id?:number;matricula?:string};
export function normalizarCorregedoria(v:unknown){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toUpperCase().replace(/\s+/g,"_");}
export function lerUsuarioCorregedoria():UsuarioCorregedoria|null{if(typeof window==="undefined")return null;try{const u=JSON.parse(localStorage.getItem("usuarioLogado")||"null");if(!u?.id||!u?.perfil||!u?.municipio_id)return null;return {...u,perfil:normalizarCorregedoria(u.perfil)};}catch{return null;}}
export function podeGerenciarCorregedoria(p:string){return ["DESENVOLVEDOR","ADMIN","COMANDANTE","DIRETOR","CORREGEDOR"].includes(normalizarCorregedoria(p));}
export function fmtData(v?:string|null){if(!v)return"--";const d=new Date(`${v}T12:00:00`);return Number.isNaN(d.getTime())?v:d.toLocaleDateString("pt-BR");}
export function classeStatus(s:string){const v=normalizarCorregedoria(s);if(v==="CONCLUIDO"||v==="ARQUIVADO")return"border-emerald-400/25 bg-emerald-400/10 text-emerald-300";if(v==="EM_INSTRUCAO")return"border-cyan-400/25 bg-cyan-400/10 text-cyan-300";if(v==="SUSPENSO")return"border-amber-400/25 bg-amber-400/10 text-amber-300";return"border-blue-400/25 bg-blue-400/10 text-blue-300";}
