"use client";
import {useEffect,useState} from "react";
import type {User} from "@supabase/supabase-js";
import {usePathname,useRouter} from "next/navigation";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";

const menu=[
 {href:"/dashboard",label:"Visão geral",symbol:"◫"},
 {href:"/escolas",label:"Escolas",symbol:"▥"},
 {href:"/turmas",label:"Turmas",symbol:"▦"},
 {href:"/alunos",label:"Alunos",symbol:"♙"},
 {href:"/competencias",label:"Competências",symbol:"✧"},
 {href:"/avaliacoes",label:"Avaliações",symbol:"☑"},
 {href:"/relatorios",label:"Relatórios",symbol:"◴"},
] as const;

export default function ProfessorShell({children}:{children:(user:User)=>React.ReactNode}){
 const [user,setUser]=useState<User|null>(null);
 const [loading,setLoading]=useState(true);
 const [menuOpen,setMenuOpen]=useState(false);
 const [signingOut,setSigningOut]=useState(false);
 const pathname=usePathname();
 const router=useRouter();
 useEffect(()=>{
  let mounted=true;const client=getSupabase();
  const {data:{subscription}}=client.auth.onAuthStateChange((_,session)=>{
   if(!mounted)return;setUser(session?.user??null);
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
 useEffect(()=>setMenuOpen(false),[pathname]);
 if(loading)return <main className="wrap">Carregando conta...</main>;
 if(!user)return <main className="wrap">Redirecionando para login...</main>;
 const nome=String(user.user_metadata?.full_name||user.user_metadata?.name||user.email?.split("@")[0]||"Professor");
 const letra=nome.trim().charAt(0).toUpperCase()||"P";
 const atual=menu.find(m=>m.href===pathname)?.label??(pathname==="/design-system"?"Design System":"Portal do Professor");
 async function sair(){
  if(signingOut)return;setSigningOut(true);
  const {error}=await getSupabase().auth.signOut();
  if(error){setSigningOut(false);window.alert("Não foi possível sair: "+error.message);return;}
  router.replace("/login");
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
      <span className="jobie-menu-icon" aria-hidden="true">{m.symbol}</span><span>{m.label}</span>
    </Link>)}
   </nav>
   <div className="jobie-sidebar-bottom">
    <Link href="/design-system" className={"jobie-menu-item jobie-lab"+(pathname==="/design-system"?" is-active":"")}><span className="jobie-menu-icon" aria-hidden="true">◈</span><span>Design System</span></Link>
    <p>Portal do Professor <span>Interface inspirada no Jobie</span></p>
   </div>
  </aside>
  <div className="jobie-workspace">
   <header className="jobie-topbar">
    <div className="jobie-topbar-start">
     <button type="button" className="jobie-menu-trigger" aria-label={menuOpen?"Fechar menu":"Abrir menu"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}><span aria-hidden="true">☰</span></button>
     <div className="jobie-topbar-title"><span className="jobie-breadcrumb">Portal do Professor /</span><strong>{atual}</strong></div>
    </div>
    <div className="jobie-account"><span className="jobie-avatar" aria-hidden="true">{letra}</span><div className="jobie-account-details"><strong>{nome}</strong><small>Minha conta</small></div><button type="button" className="jobie-exit" disabled={signingOut} onClick={()=>void sair()}>{signingOut?"Saindo...":"Sair"}</button></div>
   </header>
   <div className="jobie-content">{children(user)}</div>
  </div>
 </div>;
}
