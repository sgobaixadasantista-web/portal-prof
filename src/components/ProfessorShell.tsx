"use client";
import {useEffect,useState} from "react";
import type {User} from "@supabase/supabase-js";
import {usePathname,useRouter} from "next/navigation";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";
import PortalIcon, {type PortalIconName} from "@/components/ui/PortalIcon";

const menu=[
 {href:"/dashboard",label:"Visão geral",icon:"dashboard"},
 {href:"/escolas",label:"Escolas",icon:"school"},
 {href:"/turmas",label:"Turmas",icon:"classes"},
 {href:"/alunos",label:"Alunos",icon:"students"},
 {href:"/competencias",label:"Competências",icon:"competencies"},
 {href:"/avaliacoes",label:"Avaliações",icon:"assessments"},
 {href:"/relatorios",label:"Relatórios",icon:"reports"},
 ] satisfies ReadonlyArray<{href:string;label:string;icon:PortalIconName}>;

let cachedUser:User|null=null;

export default function ProfessorShell({children}:{children:(user:User)=>React.ReactNode}){
 const [user,setUser]=useState<User|null>(cachedUser);
 const [loading,setLoading]=useState(!cachedUser);
 const [menuOpen,setMenuOpen]=useState(false);
 const [signingOut,setSigningOut]=useState(false);
 const [accountOpen,setAccountOpen]=useState(false);
 const pathname=usePathname();
 const router=useRouter();
 useEffect(()=>{
  let mounted=true;const client=getSupabase();
  const {data:{subscription}}=client.auth.onAuthStateChange((_,session)=>{
   if(!mounted)return;cachedUser=session?.user??null;setUser(cachedUser);
   if(!session?.user)router.replace("/login");
  });
  client.auth.getUser().then(({data,error})=>{
   if(!mounted)return;
   if(error||!data.user){cachedUser=null;router.replace("/login");setUser(null);}
   else {cachedUser=data.user;setUser(data.user);}
   setLoading(false);
  });
  return ()=>{mounted=false;subscription.unsubscribe();};
 },[router]);
 useEffect(()=>{setMenuOpen(false);setAccountOpen(false);},[pathname]);
 if(loading&&!user)return <main className="jobie-auth-loading"><div className="jobie-auth-loading-side"/><div className="jobie-auth-loading-main"><div className="jobie-loading-bar"/><div className="jobie-loading-card"/><div className="jobie-loading-card"/></div></main>;
 if(!user)return <main className="wrap">Redirecionando para login...</main>;
 const nome=String(user.user_metadata?.full_name||user.user_metadata?.name||user.email?.split("@")[0]||"Professor");
 const letra=nome.trim().charAt(0).toUpperCase()||"P";
 const tituloPagina=menu.find(item=>item.href===pathname)?.label??(pathname==="/design-system"?"Design System":"Portal do Professor");
 async function sair(){
  if(signingOut)return;setSigningOut(true);
  const {error}=await getSupabase().auth.signOut();
  if(error){setSigningOut(false);window.alert("Não foi possível sair: "+error.message);return;}
  cachedUser=null;router.replace("/login");
 }
 return <div className="jobie-shell">
  {menuOpen&&<button type="button" className="jobie-backdrop" aria-label="Fechar navegação" onClick={()=>setMenuOpen(false)}/>}
  <aside className={"jobie-sidebar"+(menuOpen?" is-open":"")} aria-label="Navegação principal">
   <Link href="/dashboard" className="jobie-logo" aria-label="Portal do Professor — início">
    <span className="jobie-logo-mark">P</span>
    <span>Portal <small>do Professor</small></span>
   </Link>
   <nav className="jobie-menu">
    {menu.map(m=><Link key={m.href} href={m.href} className={"jobie-menu-item"+(pathname===m.href?" is-active":"")} aria-current={pathname===m.href?"page":undefined}>
      <span className="jobie-menu-icon" aria-hidden="true"><PortalIcon name={m.icon} size={21}/></span><span>{m.label}</span>
    </Link>)}
   </nav>
  </aside>
  <div className="jobie-workspace">
   <header className="jobie-topbar">
    <div className="jobie-topbar-start">
     <button type="button" className="jobie-menu-trigger" aria-label={menuOpen?"Fechar menu":"Abrir menu"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}><PortalIcon name="menu" size={22}/></button>
     <h1 className="jobie-topbar-current-title">{tituloPagina}</h1>
    </div>
    <div className="jobie-topbar-end">
     <div className="jobie-account-menu">
      <button type="button" className="jobie-profile-trigger" aria-expanded={accountOpen} aria-label="Opções da minha conta" onClick={()=>setAccountOpen(x=>!x)}>
       <span className="jobie-avatar" aria-hidden="true">{letra}</span>
       <span className="jobie-account-details"><strong title={nome}>{nome}</strong><small>Professor(a)</small></span>
       <span aria-hidden="true" className="jobie-profile-chevron">⌄</span>
      </button>
      {accountOpen&&<div className="jobie-account-dropdown"><div className="jobie-dropdown-email">{user.email}</div><button type="button" disabled={signingOut} onClick={()=>void sair()}>{signingOut?"Saindo...":"Sair da conta"}</button></div>}
     </div>
    </div>
   </header>
   <div className="jobie-content">{children(user)}</div>
  </div>
 </div>;
}
