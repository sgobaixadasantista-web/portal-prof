"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import type {User} from "@supabase/supabase-js";
import ProfessorShell from "@/components/ProfessorShell";
import {getSupabase} from "@/lib/supabase";
import PortalIcon, {type PortalIconName} from "@/components/ui/PortalIcon";

type Totais={escolas:number|null;turmas:number|null;alunos:number|null;avaliacoes:number|null;concluidas:number|null};
const atalhos=[
 {href:"/escolas",titulo:"Escolas",texto:"Organize as instituições em que você leciona.",icon:"school"},
 {href:"/turmas",titulo:"Turmas",texto:"Configure séries, anos letivos e periodicidade.",icon:"classes"},
 {href:"/alunos",titulo:"Alunos",texto:"Cadastre estudantes e gerencie matrículas.",icon:"students"},
 {href:"/competencias",titulo:"Competências",texto:"Defina habilidades e pesos pedagógicos.",icon:"competencies"},
 {href:"/avaliacoes",titulo:"Avaliações",texto:"Lance conceitos e conclua avaliações.",icon:"assessments"},
 {href:"/relatorios",titulo:"Relatórios",texto:"Consulte indicadores e exporte resultados.",icon:"reports"},
 ] satisfies ReadonlyArray<{href:string;titulo:string;texto:string;icon:PortalIconName}>;
function Painel({user}:{user:User}){
 const [totais,setTotais]=useState<Totais>({escolas:null,turmas:null,alunos:null,avaliacoes:null,concluidas:null});
 const [loading,setLoading]=useState(true);
 const [erro,setErro]=useState("");
 const carregar=useCallback(async()=>{
  setLoading(true);setErro("");
  const api=getSupabase();
  const [e,t,a,av,c]=await Promise.all([
   api.from("escolas").select("id",{count:"exact",head:true}).eq("professor_id",user.id),
   api.from("turmas").select("id",{count:"exact",head:true}).eq("professor_id",user.id),
   api.from("alunos").select("id",{count:"exact",head:true}).eq("professor_id",user.id),
   api.from("avaliacoes").select("id",{count:"exact",head:true}).eq("professor_id",user.id),
   api.from("avaliacoes").select("id",{count:"exact",head:true}).eq("professor_id",user.id).eq("status","concluida")
  ]);
  if([e,t,a,av,c].some(r=>r.error))setErro("Não foi possível carregar todos os indicadores. Tente atualizar a página.");
  setTotais({escolas:e.error?null:e.count,turmas:t.error?null:t.count,alunos:a.error?null:a.count,avaliacoes:av.error?null:av.count,concluidas:c.error?null:c.count});
  setLoading(false);
 },[user.id]);
 useEffect(()=>{void carregar()},[carregar]);
 const nome=String(user.user_metadata?.full_name||user.user_metadata?.name||user.email?.split("@")[0]||"Professor");
 const stats:{label:string;value:number|null;icon:PortalIconName;tone:string}[]=[
  {label:"Escolas",value:totais.escolas,icon:"school",tone:"purple"},
  {label:"Turmas",value:totais.turmas,icon:"classes",tone:"blue"},
  {label:"Alunos",value:totais.alunos,icon:"students",tone:"green"},
  {label:"Avaliações concluídas",value:totais.concluidas,icon:"assessments",tone:"lime"}
 ];
 const pendentes=totais.avaliacoes!==null&&totais.concluidas!==null?Math.max(0,totais.avaliacoes-totais.concluidas):null;
 return <main className="wrap jobie-dashboard">
  <div className="jobie-welcome"><div><span className="jobie-overline">ACOMPANHAMENTO PEDAGÓGICO</span><h1>Olá, {nome}!</h1><p className="muted">Seu espaço de gestão para acompanhar escolas, turmas, alunos e avaliações.</p></div><Link href="/avaliacoes" className="jobie-action-button">Nova avaliação <span aria-hidden="true">↗</span></Link></div>
  {erro&&<p role="alert" className="error">{erro}</p>}
  {!loading&&pendentes!==null&&pendentes>0&&<div className="jobie-action-required" role="status"><div><strong>{pendentes} avaliação{pendentes===1?"":"ões"} em rascunho</strong><p>Você pode continuar o preenchimento e concluir quando estiver pronto.</p></div><Link href="/avaliacoes">Continuar avaliações →</Link></div>}
  <div className="jobie-stat-grid">{stats.map(s=><div key={s.label} className={"jobie-stat-card jobie-stat-"+s.tone}><span className="jobie-stat-icon" aria-hidden="true"><PortalIcon name={s.icon} size={27}/></span><div><span>{s.label}</span><strong>{loading?"—":s.value===null?"—":s.value}</strong></div></div>)}</div>
  <div className="jobie-dashboard-columns">
   <section className="card jobie-progress-card">
    <div className="row"><div><span className="jobie-section-kicker">SEU ACOMPANHAMENTO</span><h2>Situação das avaliações</h2></div><Link href="/relatorios" className="jobie-text-link">Ver relatórios →</Link></div>
    <div className="jobie-progress-body"><div className="jobie-progress-circle" style={{background:totais.avaliacoes&&totais.concluidas!==null?`conic-gradient(#5734dc ${Math.round(totais.concluidas/totais.avaliacoes*100)}%,#eae8f2 0)`:"conic-gradient(#eae8f2 100%,#eae8f2 0)"}}><div><strong>{totais.avaliacoes&&totais.concluidas!==null?Math.round(totais.concluidas/totais.avaliacoes*100)+"%":"—"}</strong><small>concluídas</small></div></div><div className="jobie-progress-details"><div><span className="jobie-dot jobie-dot-purple"></span><span>Concluídas</span><strong>{totais.concluidas??"—"}</strong></div><div><span className="jobie-dot jobie-dot-grey"></span><span>Em rascunho</span><strong>{pendentes??"—"}</strong></div><p className="muted small">Os indicadores consideram somente avaliações da sua conta.</p></div></div>
   </section>
   <section className="card jobie-todo-card">
    <span className="jobie-section-kicker">ACESSO RÁPIDO</span><h2>Continuar trabalhando</h2>
    <div className="jobie-todo-links"><Link href="/avaliacoes"><span className="jobie-shortcut-icon"><PortalIcon name="assessments" size={21}/></span><span><strong>Lançar conceitos</strong><small>Ficha individual ou por turma</small></span><span aria-hidden="true">→</span></Link><Link href="/competencias"><span className="jobie-shortcut-icon"><PortalIcon name="competencies" size={21}/></span><span><strong>Configurar competências</strong><small>Disciplinas, habilidades e pesos</small></span><span aria-hidden="true">→</span></Link><Link href="/relatorios"><span className="jobie-shortcut-icon"><PortalIcon name="reports" size={21}/></span><span><strong>Emitir relatórios</strong><small>Individual, turma e evolução</small></span><span aria-hidden="true">→</span></Link></div>
   </section>
  </div>
  <div className="jobie-section-heading"><div><span className="jobie-section-kicker">MÓDULOS</span><h2>Gerenciar meu ambiente</h2></div></div>
  <div className="jobie-module-grid">{atalhos.map(x=><Link className="jobie-module-card" href={x.href} key={x.href}><span className="jobie-module-icon" aria-hidden="true"><PortalIcon name={x.icon} size={24}/></span><strong>{x.titulo}</strong><p>{x.texto}</p><span className="jobie-module-arrow">Acessar <span aria-hidden="true">→</span></span></Link>)}</div>
 </main>
}
export default function Dashboard(){return <ProfessorShell>{user=><Painel user={user}/>}</ProfessorShell>}
