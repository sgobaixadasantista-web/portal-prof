"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function CallbackPage() {
 const router=useRouter();
 const [error,setError]=useState("");
 useEffect(()=>{
   let active=true;
   async function finish(){
     try {
       const params=new URLSearchParams(window.location.search);
       const err=params.get("error_description")||params.get("error");
       if(err) throw new Error(err);
       const code=params.get("code");
       const supabase=getSupabase();
       if(code){
         const {error}=await supabase.auth.exchangeCodeForSession(code);
         if(error) throw error;
       }
       const {data:{user},error:userError}=await supabase.auth.getUser();
       if(userError||!user) throw new Error("Sessão não encontrada. Tente entrar novamente.");
       if(active) router.replace("/dashboard");
     }catch(e){if(active)setError(e instanceof Error?e.message:"Falha no retorno do login");}
   }
   finish();
   return ()=>{active=false;};
 },[router]);
 return <main className="auth"><div className="card"><h1>Autenticação</h1>{error?<><p role="alert" className="error">{error}</p><Link href="/login">Voltar ao login</Link></>:<p>Confirmando acesso...</p>}</div></main>;
}
