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
  const titulo=mode==="login"?"Bem-vindo de volta":mode==="cadastro"?"Crie sua conta":"Recupere seu acesso";
  const descricao=mode==="login"?"Acesse suas turmas, avaliações e relatórios em um só lugar.":mode==="cadastro"?"Organize o acompanhamento pedagógico das suas turmas.":"Enviaremos orientações de recuperação para o e-mail informado.";
  return <main className="auth-page">
   <div className="auth-layout">
    <aside className="auth-showcase" aria-label="Portal do Professor">
     <div className="auth-showcase-brand"><span className="auth-showcase-mark" aria-hidden="true">P</span><span>Portal <strong>do Professor</strong></span></div>
     <div className="auth-showcase-copy">
      <span className="auth-eyebrow">ACOMPANHAMENTO PEDAGÓGICO</span>
      <h1>Mais clareza para ensinar.<br/><em>Mais tempo para aprender.</em></h1>
      <p>Organize escolas, turmas e competências. Registre avaliações e acompanhe a evolução dos alunos com tranquilidade.</p>
      <div className="auth-feature-list"><span>✓ Avaliações por competência</span><span>✓ Relatórios pedagógicos</span><span>✓ Ambiente individual e privado</span></div>
     </div>
     <p className="auth-showcase-foot">Uma plataforma pensada para quem ensina no Ensino Fundamental I.</p>
    </aside>
    <section className="auth-panel" aria-labelledby="auth-form-title">
     <div className="auth-panel-inner">
      <div className="auth-mobile-brand"><span className="auth-showcase-mark" aria-hidden="true">P</span><strong>Portal do Professor</strong></div>
      <div className="auth-form-heading"><span className="auth-eyebrow">SEU ESPAÇO PEDAGÓGICO</span><h2 id="auth-form-title">{titulo}</h2><p>{descricao}</p></div>
      <form onSubmit={submit} className="auth-form">
       {mode==="cadastro"&&<label className="field">Nome do professor<input required value={nome} onChange={e=>setNome(e.target.value)} autoComplete="name" placeholder="Seu nome completo"/></label>}
       <label className="field">E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="voce@exemplo.com"/></label>
       {mode!=="recuperar"&&<label className="field">Senha<input type="password" minLength={6} required value={senha} onChange={e=>setSenha(e.target.value)} autoComplete={mode==="login"?"current-password":"new-password"} placeholder="Digite sua senha"/></label>}
       {mode==="login"&&<div className="auth-helper"><Link href="/recuperar-senha">Esqueceu sua senha?</Link></div>}
       <button className="full auth-primary" disabled={busy} aria-busy={busy}>{busy?"Processando...":mode==="login"?"Entrar":mode==="cadastro"?"Criar conta":"Enviar link de recuperação"}</button>
      </form>
      {mode!=="recuperar"&&<><div className="auth-divider"><span>ou continue com</span></div><button className="secondary full auth-google" type="button" disabled={busy} onClick={google}><span aria-hidden="true" className="auth-google-symbol">G</span>Google</button></>}
      {error&&<p role="alert" className="auth-feedback auth-feedback--error">{error}</p>}
      {success&&<p role="status" className="auth-feedback auth-feedback--success">{success}</p>}
      <p className="auth-bottom-link">
       {mode==="login"?<>Ainda não tem uma conta? <Link href="/cadastro">Criar acesso</Link></>:<>Já tem uma conta? <Link href="/login">Voltar ao login</Link></>}
      </p>
      <p className="auth-privacy">Seus dados pedagógicos permanecem vinculados à sua conta.</p>
     </div>
    </section>
   </div>
  </main>;
}
