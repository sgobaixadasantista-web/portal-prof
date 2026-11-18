"use client";

import {createContext,useCallback,useEffect,useState} from "react";
import type {User} from "@supabase/supabase-js";
import {usePathname,useRouter} from "next/navigation";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";
import PortalIcon,{type PortalIconName} from "@/components/ui/PortalIcon";

export const ProfessorContext=createContext<User|null>(null);

const menus:{href:string;label:string;icon:PortalIconName}[]=[
 {href:"/dashboard",label:"Visão geral",icon:"dashboard"},
 {href:"/escolas",label:"Escolas",icon:"school"},
 {href:"/turmas",label:"Turmas",icon:"classes"},
 {href:"/alunos",label:"Alunos",icon:"students"},
 {href:"/competencias",label:"Competências",icon:"competencies"},
 {href:"/avaliacoes",label:"Avaliações",icon:"assessments"},
 {href:"/relatorios",label:"Relatórios",icon:"reports"}
];

const publica=(path:string)=>path==="/"||path==="/login"||path==="/cadastro"||path==="/recuperar-senha"||path.startsWith("/auth/");

export default function PortalFrame({children}:{children:React.ReactNode}){
 const pathname=usePathname();
 const router=useRouter();
 const [user,setUser]=useState<User|null>(null);
 const [carregando,setCarregando]=useState(true);
 const [menuAberto,setMenuAberto]=useState(false);
 const [perfilAberto,setPerfilAberto]=useState(false);
 const [saindo,setSaindo]=useState(false);
 const rotaPublica=publica(pathname);

 useEffect(()=>{
  let ativo=true;
  const api=getSupabase();
  const {data:{subscription}}=api.auth.onAuthStateChange((_,sessao)=>{
   if(!ativo)return;
   setUser(sessao?.user??null);
   if(!sessao?.user&&!publica(window.location.pathname))router.replace("/login");
  });
  api.auth.getUser().then(({data,error})=>{
   if(!ativo)return;
   if(error||!data.user){setUser(null);if(!publica(window.location.pathname))router.replace("/login");}
   else setUser(data.user);
   setCarregando(false);
  });
  return ()=>{ativo=false;subscription.unsubscribe();};
 },[router]);

 useEffect(()=>{setMenuAberto(false);setPerfilAberto(false);},[pathname]);

 const sair=useCallback(async()=>{
  if(saindo)return;
  setSaindo(true);
  const {error}=await getSupabase().auth.signOut();
  if(error){setSaindo(false);window.alert("Não foi possível sair: "+error.message);return;}
  setUser(null);
  setSaindo(false);
  router.replace("/login");
 },[router,saindo]);

 if(rotaPublica)return <>{children}</>;
 if(carregando)return <div className="jobie-auth-loading" role="status" aria-label="Carregando portal">
  <div className="jobie-auth-loading-side"/><div className="jobie-auth-loading-main">
  <div className="jobie-loading-bar"/><div className="jobie-loading-card"/><div className="jobie-loading-card"/>
  </div></div>;
 if(!user)return <main className="jobie-auth-loading" role="status">Redirecionando para o login...</main>;

 const nome=String(user.user_metadata?.full_name||user.user_metadata?.name||user.email?.split("@")[0]||"Professor");
 const letra=nome.trim().charAt(0).toLocaleUpperCase("pt-BR")||"P";
 const titulo=menus.find(m=>m.href===pathname)?.label??(pathname==="/design-system"?"Design System":"Portal do Professor");

 return <ProfessorContext.Provider value={user}><div className="jobie-shell">
  {menuAberto&&<button type="button" className="jobie-backdrop" aria-label="Fechar menu" onClick={()=>setMenuAberto(false)}/>}
  <aside className={"jobie-sidebar"+(menuAberto?" is-open":"")} aria-label="Navegação principal">
   <Link href="/dashboard" className="jobie-logo" aria-label="Portal do Professor, início">
    <span className="jobie-logo-mark" aria-hidden="true">P</span><span>Portal <small>do Professor</small></span>
   </Link>
   <nav className="jobie-menu">
    {menus.map(m=><Link key={m.href} href={m.href} className={"jobie-menu-item"+(pathname===m.href?" is-active":"")} aria-current={pathname===m.href?"page":undefined}>
     <span className="jobie-menu-icon" aria-hidden="true"><PortalIcon name={m.icon} size={21}/></span><span>{m.label}</span>
    </Link>)}
   </nav>
  </aside>
  <div className="jobie-workspace">
   <header className="jobie-topbar">
    <div className="jobie-topbar-start">
     <button className="jobie-menu-trigger" type="button" aria-label={menuAberto?"Fechar menu":"Abrir menu"} aria-expanded={menuAberto} onClick={()=>setMenuAberto(x=>!x)}><PortalIcon name="menu" size={22}/></button>
     <h1 className="jobie-topbar-current-title">{titulo}</h1>
    </div>
    <div className="jobie-topbar-end"><div className="jobie-account-menu">
     <button className="jobie-profile-trigger" type="button" aria-expanded={perfilAberto} aria-label="Opções da minha conta" onClick={()=>setPerfilAberto(v=>!v)}>
      <span className="jobie-avatar" aria-hidden="true">{letra}</span>
      <span className="jobie-account-details"><strong title={nome}>{nome}</strong><small>Professor(a)</small></span>
      <span className="jobie-profile-chevron" aria-hidden="true">⌄</span>
     </button>
     {perfilAberto&&<div className="jobie-account-dropdown"><div className="jobie-dropdown-email">{user.email}</div>
      <button type="button" disabled={saindo} onClick={()=>void sair()}>{saindo?"Saindo...":"Sair da conta"}</button>
     </div>}
    </div></div>
   </header>
   <div className="jobie-content">{children}</div>
  </div>
 </div></ProfessorContext.Provider>;
}
