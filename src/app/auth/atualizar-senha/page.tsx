"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export default function AtualizarSenha(){
 const [senha,setSenha]=useState("");
 const [pronto,setPronto]=useState(false);
 const [mensagem,setMensagem]=useState("");
 const [erro,setErro]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  const client=getSupabase();
  const {data:{subscription}}=client.auth.onAuthStateChange((event)=>{
    if(event==="PASSWORD_RECOVERY"||event==="SIGNED_IN")setPronto(true);
  });
  const params=new URLSearchParams(window.location.search);
  const code=params.get("code");
  if(code)client.auth.exchangeCodeForSession(code).then(({error})=>{if(error)setErro(error.message);else setPronto(true);});
  else client.auth.getSession().then(({data})=>setPronto(!!data.session));
  return ()=>subscription.unsubscribe();
 },[]);
 async function salvar(e:React.FormEvent){
   e.preventDefault();setBusy(true);setErro("");
   const {error}=await getSupabase().auth.updateUser({password:senha});
   if(error)setErro(error.message);else setMensagem("Senha atualizada. Você já pode entrar.");
   setBusy(false);
 }
 return <main className="auth"><div className="card stack"><h1>Atualizar senha</h1>
 {!pronto&&<p className="muted">Abra o link de recuperação enviado para seu e-mail. Se você acabou de abrir o link, aguarde a validação.</p>}
 {pronto&&!mensagem&&<form onSubmit={salvar}><label className="field">Nova senha<input type="password" minLength={8} required value={senha} onChange={e=>setSenha(e.target.value)}/></label><button disabled={busy}>Salvar nova senha</button></form>}
 {mensagem&&<p role="status" className="success">{mensagem}</p>}
 {erro&&<p role="alert" className="error">{erro}</p>}
 <Link href="/login">Voltar ao login</Link></div></main>;
}
