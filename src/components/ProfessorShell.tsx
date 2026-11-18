"use client";
import {useContext} from "react";
import type {User} from "@supabase/supabase-js";
import {ProfessorContext} from "@/components/PortalFrame";

/** A navegação fica no PortalFrame persistente (layout raiz).
 * Este componente mantém a API de renderização das páginas existentes. */
export default function ProfessorShell({children}:{children:(user:User)=>React.ReactNode}){
 const user=useContext(ProfessorContext);
 if(!user)return <main className="wrap" role="status">Carregando conteúdo...</main>;
 return <>{children(user)}</>;
}
