"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export default function ProfessorShell({children}:{children:(user:User)=>React.ReactNode}){
 const [user,setUser]=useState<User|null>(null);
 const [loading,setLoading]=useState(true);
 const router=useRouter();
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
 if(loading)return <main className="wrap">Carregando conta...</main>;
 if(!user)return <main className="wrap">Redirecionando para o login...</main>;
 return <><nav className="nav"><div className="nav-inner"><Link className="brand" href="/dashboard">Portal do Professor</Link><Link href="/dashboard">Dashboard</Link><Link href="/escolas">Escolas</Link><Link href="/turmas">Turmas</Link><button className="secondary" onClick={async()=>{await getSupabase().auth.signOut();router.replace("/login");}}>Sair</button></div></nav>{children(user)}</>;
}
