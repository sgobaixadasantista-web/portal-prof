"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

const links=[
 {href:"/dashboard",label:"Início"},
 {href:"/escolas",label:"Escolas"},
 {href:"/turmas",label:"Turmas"},
 {href:"/alunos",label:"Alunos"},
 {href:"/competencias",label:"Competências"},
 {href:"/avaliacoes",label:"Avaliações"},
 {href:"/relatorios",label:"Relatórios"},
] as const;

export default function ProfessorShell({children}:{children:(user:User)=>React.ReactNode}){
 const [user,setUser]=useState<User|null>(null);
 const [loading,setLoading]=useState(true);
 const [menuOpen,setMenuOpen]=useState(false);
 const [signingOut,setSigningOut]=useState(false);
 const router=useRouter();
 const pathname=usePathname();
 useEffect(()=>{
  let mounted=true;
  const client=getSupabase();
  const {data:{subscription}}=client.auth.onAuthStateChange((_,session)=>{
   if(!mounted)return;
   setUser(session?.user??null);
   if(!session?.user)router.replace("/login");
  });
  client.auth.getUser().then(({data,error})=>{
   if(!mounted)return;
   if(error||!data.user){router.replace("/login");setUser(null);}
   else setUser(data.user);
   setLoading(false);
  });
  return ()=>{mounted=false;subscription.unsubscribe();};
 },[router]);
 useEffect(()=>{setMenuOpen(false);},[pathname]);
 if(loading)return <main className="wrap">Carregando conta...</main>;
 if(!user)return <main className="wrap">Redirecionando para o login...</main>;
 const signOut=async()=>{
  if(signingOut)return;
  setSigningOut(true);
  const {error}=await getSupabase().auth.signOut();
  if(error){setSigningOut(false);window.alert("Não foi possível sair: "+error.message);return;}
  router.replace("/login");
 };
 return <>
  <nav className="nav" aria-label="Navegação principal">
   <div className="nav-inner">
    <Link className="brand" href="/dashboard" aria-label="Portal do Professor — início">
     <span className="brand-symbol" aria-hidden="true">P</span>
     <span className="brand-label">Portal <small>do Professor</small></span>
    </Link>
    <button type="button" className="nav-toggle secondary" aria-controls="prof-nav-links" aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?"Fechar menu":"Menu"}<span aria-hidden="true">{menuOpen?" ×":" ☰"}</span></button>
    <div id="prof-nav-links" className={"nav-links"+(menuOpen?" is-open":"")}>
     {links.map(link=><Link key={link.href} href={link.href} className={pathname===link.href?"nav-link is-active":"nav-link"} aria-current={pathname===link.href?"page":undefined}>{link.label}</Link>)}
     <Link href="/design-system" className={pathname==="/design-system"?"nav-link nav-link--lab is-active":"nav-link nav-link--lab"} aria-current={pathname==="/design-system"?"page":undefined}>Design System</Link>
     <button type="button" className="secondary nav-logout" disabled={signingOut} onClick={()=>void signOut()}>{signingOut?"Saindo...":"Sair"}</button>
    </div>
   </div>
  </nav>
  {children(user)}
 </>;
}
