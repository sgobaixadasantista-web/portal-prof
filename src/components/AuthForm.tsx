"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

type Mode = "login" | "cadastro" | "recuperar";
export default function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();setBusy(true);setError("");setSuccess("");
    try {
      const supabase=getSupabase();
      if(mode==="recuperar") {
        const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/auth/atualizar-senha"});
        if(error) throw error;
        setSuccess("Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.");
      } else if(mode==="cadastro") {
        const {error}=await supabase.auth.signUp({email,password:senha,options:{data:{full_name:nome},emailRedirectTo:window.location.origin+"/auth/callback"}});
        if(error) throw error;
        setSuccess("Cadastro solicitado. Confirme seu e-mail para entrar.");
      } else {
        const {error}=await supabase.auth.signInWithPassword({email,password:senha});
        if(error) throw error;
        window.location.assign("/dashboard");
      }
    } catch(err){setError(err instanceof Error?err.message:"Falha inesperada");}finally{setBusy(false);}
  }
  async function google(){
    setBusy(true);setError("");
    try{
      const {error}=await getSupabase().auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin+"/auth/callback"}});
      if(error) throw error;
    }catch(err){setError(err instanceof Error?err.message:"Erro no Google");setBusy(false);}
  }
  return <main className="auth"><div className="card stack">
    <div style={{textAlign:"center"}}><div style={{fontSize:34}}>▣</div><h1>Portal do Professor</h1><p className="muted">Acompanhamento pedagógico • Fundamental I</p></div>
    <h2>{mode==="login"?"Entrar":mode==="cadastro"?"Criar acesso":"Recuperar senha"}</h2>
    <form onSubmit={submit}>
      {mode==="cadastro"&&<label className="field">Nome do professor<input required value={nome} onChange={e=>setNome(e.target.value)} autoComplete="name"/></label>}
      <label className="field">E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
      {mode!=="recuperar"&&<label className="field">Senha<input type="password" minLength={6} required value={senha} onChange={e=>setSenha(e.target.value)} autoComplete={mode==="login"?"current-password":"new-password"}/></label>}
      <button className="full" disabled={busy}>{busy?"Processando...":mode==="login"?"Entrar":mode==="cadastro"?"Criar conta":"Enviar link de recuperação"}</button>
    </form>
    {mode!=="recuperar"&&<><div className="divider"/><button className="secondary full" type="button" disabled={busy} onClick={google}>Continuar com Google</button></>}
    {error&&<p role="alert" className="error">{error}</p>}
    {success&&<p role="status" className="success">{success}</p>}
    <p className="small muted" style={{textAlign:"center"}}>
      {mode==="login"?<><Link href="/recuperar-senha">Esqueceu sua senha?</Link> · <Link href="/cadastro">Criar acesso</Link></>:<Link href="/login">Voltar ao login</Link>}
    </p>
  </div></main>;
}
