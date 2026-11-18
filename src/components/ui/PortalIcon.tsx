import type {SVGProps} from "react";

export type PortalIconName =
 | "dashboard" | "school" | "classes" | "students" | "competencies"
 | "assessments" | "reports" | "design" | "menu";

type Props=Omit<SVGProps<SVGSVGElement>,"name"> & {name:PortalIconName;size?:number};

/** Ícones vetoriais consistentes, estilo outline (24px, traço 1.9).
 * Decorativos por padrão. O texto adjacente mantém acessibilidade do menu. */
export default function PortalIcon({name,size=21,...props}:Props){
 const common={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.9,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true as const,...props};
 switch(name){
  case "dashboard":return <svg {...common}><rect x="3" y="3" width="7" height="9" rx="1.4"/><rect x="14" y="3" width="7" height="5" rx="1.4"/><rect x="14" y="12" width="7" height="9" rx="1.4"/><rect x="3" y="16" width="7" height="5" rx="1.4"/></svg>;
  case "school":return <svg {...common}><path d="M3 21V8l9-5 9 5v13"/><path d="M2 21h20M8 21v-7h8v7M7 10h.01M12 10h.01M17 10h.01"/></svg>;
  case "classes":return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12M15 9v12M6 6h.01M10 6h.01"/></svg>;
  case "students":return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M21 21v-2a4 4 0 0 0-3-3.87M16 3.2a4 4 0 0 1 0 7.6"/></svg>;
  case "competencies":return <svg {...common}><path d="m12 3 2.65 5.5 6.05.88-4.38 4.27 1.04 6.03L12 16.83l-5.36 2.85 1.04-6.03L3.3 9.38l6.05-.88L12 3Z"/></svg>;
  case "assessments":return <svg {...common}><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 11l2 2 4-4M9 17h6"/></svg>;
  case "reports":return <svg {...common}><path d="M5 3h10l4 4v14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h4M7 17v-3M11 17v-5M15 17v-7"/></svg>;
  case "design":return <svg {...common}><path d="M4 3h6v6H4zM14 3h6v6h-6zM4 13h6v6H4zM14 13l6 3-6 3-3-3 3-3Z"/></svg>;
  case "menu":return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
 }
}
