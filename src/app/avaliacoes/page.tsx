"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import type {User} from "@supabase/supabase-js";
import ProfessorShell from "@/components/ProfessorShell";
import {getSupabase} from "@/lib/supabase";

type Turma={id:string;nome:string;ano_letivo:number;ano_escolar:number;escola_id:string;periodicidade:"semanal"|"mensal"|"bimestral"|"trimestral"};
type Escola={id:string;nome:string};
type Disciplina={id:string;nome:string};
type Aluno={id:string;nome:string};
type Matricula={id:string;aluno_id:string;turma_id:string;ativo:boolean};
type Competencia={id:string;nome:string;disciplina_id:string;ativa:boolean};
type Vinculo={id:string;turma_id:string;competencia_id:string;peso:number;ativa:boolean};
type Avaliacao={id:string;matricula_id:string;disciplina_id:string;periodo_rotulo:string;data_avaliacao:string;status:"rascunho"|"concluida";observacoes:string|null};
type Item={avaliacao_id:string;competencia_id:string;conceito:Conceito;peso_aplicado:number;competencia_nome_snapshot:string};
type Revisao={id:string;avaliacao_id:string;autor_id:string;motivo:string;reaberta_em:string;encerrada_em:string|null;encerrada_por:string|null;snapshot_antes:{avaliacao?:{observacoes?:string|null;data_avaliacao?:string};itens?:ItemSnapshot[]};snapshot_depois:{avaliacao?:{observacoes?:string|null;data_avaliacao?:string};itens?:ItemSnapshot[]}|null};
type ItemSnapshot={competencia_id:string;competencia_nome_snapshot:string;conceito:Conceito;peso_aplicado:number};
type Conceito="nao_avaliado"|"ruim"|"regular"|"bom"|"otimo";
type Estado={notas:Record<string,Conceito>;observacoes:string;data:string};
const conceitos:{value:Conceito;label:string;nota:number|null}[]=[
 {value:"nao_avaliado",label:"Não avaliado",nota:null},
 {value:"ruim",label:"Ruim",nota:2.5},
 {value:"regular",label:"Regular",nota:5},
 {value:"bom",label:"Bom",nota:7.5},
 {value:"otimo",label:"Ótimo",nota:10}
];
const valor=(conceito:Conceito)=>conceitos.find(c=>c.value===conceito)?.nota??null;
const rotuloConceito=(conceito:Conceito|undefined)=>conceito===undefined?"Não existia":conceitos.find(c=>c.value===conceito)?.label??conceito;
const hoje=()=>{const agora=new Date();const local=new Date(agora.getTime()-agora.getTimezoneOffset()*60000);return local.toISOString().slice(0,10);};
const estadoVazio=():Estado=>({notas:{},observacoes:"",data:hoje()});
function indicadores(notas:Record<string,Conceito>,competencias:{id:string;peso:number}[]){
 let soma=0,pesos=0;
 for(const c of competencias){
  const nota=valor(notas[c.id]??"nao_avaliado");
  if(nota!==null&&c.peso>0){soma+=nota*c.peso;pesos+=c.peso;}
 }
 return pesos?soma/pesos:null;
}
const formato=(n:number|null)=>n===null?"—":n.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1});

function Tela({user}:{user:User}){
 const [escolas,setEscolas]=useState<Escola[]>([]);
 const [turmas,setTurmas]=useState<Turma[]>([]);
 const [disciplinas,setDisciplinas]=useState<Disciplina[]>([]);
 const [alunos,setAlunos]=useState<Aluno[]>([]);
 const [matriculas,setMatriculas]=useState<Matricula[]>([]);
 const [competencias,setCompetencias]=useState<Competencia[]>([]);
 const [vinculos,setVinculos]=useState<Vinculo[]>([]);
 const [avaliacoes,setAvaliacoes]=useState<Avaliacao[]>([]);
 const [itens,setItens]=useState<Item[]>([]);
 const [revisoes,setRevisoes]=useState<Revisao[]>([]);
 const [revisoesDisponiveis,setRevisoesDisponiveis]=useState(true);
 const [reabrindo,setReabrindo]=useState<string|null>(null);
 const [motivo,setMotivo]=useState("");
 const [turmaId,setTurmaId]=useState("");
 const [disciplinaId,setDisciplinaId]=useState("");
 const [matriculaId,setMatriculaId]=useState("");
 const [periodo,setPeriodo]=useState("");
 const [modo,setModo]=useState<"individual"|"turma">("individual");
 const [edicoes,setEdicoes]=useState<Record<string,Estado>>({});
 const [carregando,setCarregando]=useState(true);
 const [salvando,setSalvando]=useState<string|null>(null);
 const [erro,setErro]=useState("");
 const [aviso,setAviso]=useState("");
 const carregar=useCallback(async()=>{
  setCarregando(true);
  const api=getSupabase();
  const [e,t,d,a,m,c,v,avs,its,revs]=await Promise.all([
   api.from("escolas").select("id,nome").eq("professor_id",user.id),
   api.from("turmas").select("id,nome,ano_letivo,ano_escolar,escola_id,periodicidade").eq("professor_id",user.id).order("ano_letivo",{ascending:false}),
   api.from("disciplinas").select("id,nome").eq("professor_id",user.id).order("nome"),
   api.from("alunos").select("id,nome").eq("professor_id",user.id),
   api.from("matriculas").select("id,aluno_id,turma_id,ativo").eq("professor_id",user.id),
   api.from("competencias").select("id,nome,disciplina_id,ativa").eq("professor_id",user.id),
   api.from("turma_competencias").select("id,turma_id,competencia_id,peso,ativa").eq("professor_id",user.id),
   api.from("avaliacoes").select("id,matricula_id,disciplina_id,periodo_rotulo,data_avaliacao,status,observacoes").eq("professor_id",user.id),
   api.from("avaliacao_itens").select("avaliacao_id,competencia_id,conceito,peso_aplicado,competencia_nome_snapshot").eq("professor_id",user.id),
   api.from("avaliacao_revisoes").select("id,avaliacao_id,autor_id,motivo,reaberta_em,encerrada_em,encerrada_por,snapshot_antes,snapshot_depois").eq("professor_id",user.id).order("reaberta_em",{ascending:false})
  ]);
  const falha=[e,t,d,a,m,c,v,avs,its].find(r=>r.error);
  if(falha?.error)setErro(falha.error.message);
  else{
   setEscolas(e.data??[]);setTurmas(t.data??[]);setDisciplinas(d.data??[]);
   setAlunos(a.data??[]);setMatriculas(m.data??[]);setCompetencias(c.data??[]);
   setVinculos(v.data??[]);setAvaliacoes((avs.data??[]) as Avaliacao[]);setItens((its.data??[]) as Item[]);
   setRevisoesDisponiveis(!revs.error);
   setRevisoes(revs.error?[]:(revs.data??[]) as Revisao[]);
  }
  setCarregando(false);
 },[user.id]);
 useEffect(()=>{void carregar();},[carregar]);
 useEffect(()=>{if(turmas.length&&!turmas.some(t=>t.id===turmaId))setTurmaId(turmas[0].id);},[turmas,turmaId]);
 useEffect(()=>{if(disciplinas.length&&!disciplinas.some(d=>d.id===disciplinaId))setDisciplinaId(disciplinas[0].id);},[disciplinas,disciplinaId]);
 const turma=turmas.find(t=>t.id===turmaId);
 const alunosNaTurma=useMemo(()=>matriculas.filter(m=>m.turma_id===turmaId&&m.ativo).map(m=>({...m,nome:alunos.find(a=>a.id===m.aluno_id)?.nome??"Aluno"})).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")),[matriculas,alunos,turmaId]);
 useEffect(()=>{if(alunosNaTurma.length&&!alunosNaTurma.some(m=>m.id===matriculaId))setMatriculaId(alunosNaTurma[0].id);},[alunosNaTurma,matriculaId]);
 const disponiveis=useMemo(()=>vinculos.filter(v=>v.turma_id===turmaId&&v.ativa).map(v=>({id:v.competencia_id,peso:Number(v.peso),nome:competencias.find(c=>c.id===v.competencia_id)?.nome??"",disciplina_id:competencias.find(c=>c.id===v.competencia_id)?.disciplina_id,ativa:competencias.find(c=>c.id===v.competencia_id)?.ativa})).filter(c=>c.ativa&&c.disciplina_id===disciplinaId),[vinculos,competencias,turmaId,disciplinaId]);
 const rotulos=useMemo(()=>{
  if(!turma)return [];
  const ano=turma.ano_letivo;
  if(turma.periodicidade==="bimestral")return Array.from({length:4},(_,i)=>`${i+1}º Bimestre / ${ano}`);
  if(turma.periodicidade==="trimestral")return Array.from({length:3},(_,i)=>`${i+1}º Trimestre / ${ano}`);
  if(turma.periodicidade==="mensal")return Array.from({length:12},(_,i)=>`${String(i+1).padStart(2,"0")}/${ano}`);
  return Array.from({length:53},(_,i)=>`Semana ${String(i+1).padStart(2,"0")} / ${ano}`);
 },[turma]);
 useEffect(()=>{if(rotulos.length&&!rotulos.includes(periodo)){setPeriodo(rotulos[0]);setEdicoes({});}},[rotulos,periodo]);
 const avaliacaoDe=(id:string)=>avaliacoes.find(a=>a.matricula_id===id&&a.disciplina_id===disciplinaId&&a.periodo_rotulo===periodo);
 const indicadorDe=(id:string)=> {
  const av=avaliacoes.find(a=>a.matricula_id===id&&a.disciplina_id===disciplinaId&&a.periodo_rotulo===periodo);
  if(av?.status==="concluida") {
   const salvos=itens.filter(item=>item.avaliacao_id===av.id);
   return indicadores(Object.fromEntries(salvos.map(item=>[item.competencia_id,item.conceito])),salvos.map(item=>({id:item.competencia_id,peso:Number(item.peso_aplicado)})));
  }
  return indicadores(estadoDe(id).notas,disponiveis);
 };

 const estadoDe=(id:string):Estado=>{
  if(edicoes[id])return edicoes[id];
  const av=avaliacaoDe(id);
  if(!av)return estadoVazio();
  const notas:Record<string,Conceito>={};
  for(const item of itens.filter(i=>i.avaliacao_id===av.id))notas[item.competencia_id]=item.conceito;
  return {notas,observacoes:av.observacoes??"",data:av.data_avaliacao};
 };
 const editar=(id:string,changes:Partial<Estado>)=>setEdicoes(old=>({...old,[id]:{...estadoDe(id),...changes}}));
 const salvar=async(id:string,concluir:boolean)=>{
  setErro("");setAviso("");
  const matricula=alunosNaTurma.find(m=>m.id===id);
  if(!matricula||!disciplinaId||!periodo||!disponiveis.length){setErro("Selecione turma e disciplina com competências configuradas.");return;}
  const atual=avaliacaoDe(id);
  if(atual?.status==="concluida"){setErro("A avaliação concluída está bloqueada para edição. Revisões exigirão fluxo de auditoria.");return;}
  const e=estadoDe(id);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(e.data)){setErro("Informe uma data válida.");return;}
  if(concluir&&!disponiveis.some(c=>valor(e.notas[c.id]??"nao_avaliado")!==null)){
   setErro("Avalie ao menos uma competência antes de concluir.");return;
  }
  setSalvando(id);
  // V0.6: o Postgres valida e grava a avaliação e todos os itens de forma atômica.
  // A API usa auth.uid() na sessão do professor; não recebe professor_id do cliente.
  const {error:falha} = await getSupabase().rpc("motor_v06_salvar_avaliacao", {
   p_matricula_id:id,
   p_disciplina_id:disciplinaId,
   p_periodo_rotulo:periodo,
   p_data_avaliacao:e.data,
   p_observacoes:e.observacoes.trim()||null,
   p_itens:disponiveis.map(c=>({
    competencia_id:c.id,conceito:e.notas[c.id]??"nao_avaliado"
   })),
   p_concluir:concluir
  });
  if(falha){
   setErro("Não foi possível salvar a avaliação: "+falha.message);
   setSalvando(null);
   return;
  }
  setEdicoes(old=>{const updated={...old};delete updated[id];return updated;});
  await carregar();setSalvando(null);
  setAviso(concluir?"Avaliação concluída.":"Rascunho salvo.");
 };
 const reabrir=async(av:Avaliacao)=>{
  if(motivo.trim().length<10||motivo.trim().length>1000){
   setErro("Informe um motivo com 10 a 1000 caracteres.");return;
  }
  if(!window.confirm("Reabrir esta avaliação concluída para revisão? A versão anterior ficará preservada na auditoria."))return;
  setErro("");setAviso("");setSalvando(av.matricula_id);
  const {error}=await getSupabase().rpc("motor_v061_reabrir_avaliacao",{
   p_avaliacao_id:av.id,p_motivo:motivo.trim()
  });
  if(error){setErro("Não foi possível reabrir: "+error.message);}
  else{
   setReabrindo(null);setMotivo("");setEdicoes({});
   await carregar();setAviso("Avaliação reaberta como rascunho. A versão anterior foi registrada na auditoria.");
  }
  setSalvando(null);
 };
 const identificarResponsavel=(id:string|null)=>id===null?"Não identificado":id===user.id?(user.email||user.user_metadata?.full_name||"ID: "+id):"ID: "+id;
 const historico=(av:Avaliacao|undefined)=>{
  if(!av)return null;
  const registros=revisoes.filter(r=>r.avaliacao_id===av.id);
  if(!revisoesDisponiveis)return <p className="muted small">Histórico de revisões disponível após aplicar a migração V0.6.1 no Supabase.</p>;
  if(!registros.length)return <p className="muted small">Nenhuma reabertura registrada para esta avaliação.</p>;
  return <div className="turma-lista">{registros.map(r=>{
   const antes=r.snapshot_antes?.itens??[];
   const depois=r.snapshot_depois?.itens??[];
   const mudancas=depois.filter(i=>{
    const original=antes.find(a=>a.competencia_id===i.competencia_id);
    return !original||original.conceito!==i.conceito||Number(original.peso_aplicado)!==Number(i.peso_aplicado);
   });
   const observacoesAlteradas=(r.snapshot_antes?.avaliacao?.observacoes??"")!==(r.snapshot_depois?.avaliacao?.observacoes??"");
   return <div className="turma-item" key={r.id}><div>
    <strong>{r.encerrada_em?"Revisão concluída":"Revisão em andamento"}</strong>
    <p className="muted small">Reaberta em {new Date(r.reaberta_em).toLocaleString("pt-BR")} · Responsável: {identificarResponsavel(r.autor_id)}</p>
    <p className="small"><strong>Motivo:</strong> {r.motivo}</p>
    {r.encerrada_em&&<p className="muted small">Concluída em {new Date(r.encerrada_em).toLocaleString("pt-BR")} · Por: {identificarResponsavel(r.encerrada_por)}</p>}
    {r.encerrada_em&&mudancas.length===0&&!observacoesAlteradas&&<p className="small">Nenhuma alteração de conceito, peso ou observações identificada.</p>}
    {r.encerrada_em&&mudancas.map(i=>{
     const original=antes.find(a=>a.competencia_id===i.competencia_id);
     return <p className="small" key={i.competencia_id}>{i.competencia_nome_snapshot}: {rotuloConceito(original?.conceito)} → {rotuloConceito(i.conceito)}{original&&Number(original.peso_aplicado)!==Number(i.peso_aplicado)?" (peso "+original.peso_aplicado+" → "+i.peso_aplicado+")":""}</p>;
    })}
    {r.encerrada_em&&observacoesAlteradas&&<p className="small">Observações pedagógicas alteradas (conteúdo preservado nos snapshots).</p>}
   </div></div>;
  })}</div>;
 };
 function celula(m:{id:string;nome:string},c:{id:string}){
  const av=avaliacaoDe(m.id),e=estadoDe(m.id);
  return <select aria-label={m.nome+" — "+(disponiveis.find(x=>x.id===c.id)?.nome??"competência")} value={e.notas[c.id]??"nao_avaliado"} disabled={salvando!==null||av?.status==="concluida"} onChange={event=>editar(m.id,{notas:{...e.notas,[c.id]:event.target.value as Conceito}})}>
   {conceitos.map(op=><option key={op.value} value={op.value}>{op.label}</option>)}
  </select>;
 }
 return <main className="wrap">
  <h1>Avaliações pedagógicas</h1>
  <p className="muted">Avaliação única por disciplina, conceitos fixos e indicador ponderado de 0,0 a 10,0.</p>
  {erro&&<p className="error" role="alert">{erro}</p>}
  {aviso&&<p className="success" role="status">{aviso}</p>}
  <section className="card">
   <div className="form-grid">
    <label className="field">Turma<select value={turmaId} onChange={ev=>{setTurmaId(ev.target.value);setEdicoes({});}}>
      {turmas.map(t=><option key={t.id} value={t.id}>{escolas.find(e=>e.id===t.escola_id)?.nome??"Escola"} — {t.nome} ({t.ano_letivo})</option>)}
    </select></label>
    <label className="field">Disciplina<select value={disciplinaId} onChange={ev=>{setDisciplinaId(ev.target.value);setEdicoes({});}}>
      {disciplinas.map(d=><option key={d.id} value={d.id}>{d.nome}</option>)}
    </select></label>
    <label className="field">Período de avaliação<select value={periodo} onChange={ev=>{setPeriodo(ev.target.value);setEdicoes({});}}>
      {rotulos.map(p=><option key={p} value={p}>{p}</option>)}
    </select></label>
   </div>
   <div className="row" style={{justifyContent:"flex-start"}}>
    <button className={modo==="individual"?"":"secondary"} onClick={()=>setModo("individual")}>Avaliação individual</button>
    <button className={modo==="turma"?"":"secondary"} onClick={()=>setModo("turma")}>Avaliação por turma</button>
   </div>
  </section>
  {!carregando&&disponiveis.length===0&&<section className="card top-space">
   <p>Não há competências ativas vinculadas a esta turma e disciplina.</p>
   <a href="/competencias">Configurar competências</a>
  </section>}
  {carregando?<p>Carregando avaliações...</p>:disponiveis.length>0&&modo==="individual"&&<section className="card top-space">
   <label className="field">Aluno<select value={matriculaId} onChange={ev=>setMatriculaId(ev.target.value)}>
     {alunosNaTurma.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
   </select></label>
   {alunosNaTurma.filter(m=>m.id===matriculaId).map(m=>{
    const av=avaliacaoDe(m.id),e=estadoDe(m.id);
    const concl=av?.status==="concluida";
    return <div key={m.id}>
     <p className="muted">Status: <strong>{concl?"Concluída":av?"Rascunho":"Não iniciada"}</strong></p>
     <div className="form-grid">
      <label className="field">Data da avaliação<input type="date" value={e.data} disabled={concl} onChange={ev=>editar(m.id,{data:ev.target.value})}/></label>
     </div>
     <div className="turma-lista">{disponiveis.map(c=><div className="turma-item" key={c.id}>
      <div style={{flex:1}}><strong>{c.nome}</strong><p className="muted small">Peso: {c.peso}</p></div>
      <div style={{minWidth:170}}>{celula(m,c)}</div>
     </div>)}</div>
     <label className="field">Observações pedagógicas (opcional)<textarea rows={3} maxLength={2000} value={e.observacoes} disabled={concl} onChange={ev=>editar(m.id,{observacoes:ev.target.value})}/></label>
     <h2>Indicador: {formato(indicadorDe(m.id))} / 10,0</h2>
     {concl&&<section className="top-space"><h3>Revisão controlada</h3>
      <p className="muted small">Para corrigir uma avaliação concluída, informe a justificativa. A versão anterior será preservada no histórico.</p>
      {reabrindo===av?.id?<div>
       <label className="field">Motivo da reabertura<textarea rows={3} maxLength={1000} value={motivo} onChange={ev=>setMotivo(ev.target.value)} placeholder="Explique o motivo da revisão (mínimo 10 caracteres)" /></label>
       <div className="row" style={{justifyContent:"flex-start"}}>
        <button disabled={salvando!==null||motivo.trim().length<10} onClick={()=>av&&void reabrir(av)}>Confirmar reabertura</button>
        <button className="secondary" disabled={salvando!==null} onClick={()=>{setReabrindo(null);setMotivo("");}}>Cancelar</button>
       </div></div>:
       <button className="secondary" disabled={salvando!==null||!revisoesDisponiveis} onClick={()=>{setReabrindo(av?.id??null);setMotivo("");}}>Solicitar reabertura</button>}
      </section>}
     {!concl&&<div className="row" style={{justifyContent:"flex-start"}}>
      <button disabled={salvando!==null} onClick={()=>void salvar(m.id,false)}>Salvar rascunho</button>
      <button disabled={salvando!==null} onClick={()=>void salvar(m.id,true)}>Concluir avaliação</button>
     </div>}
     {av&&<section className="top-space"><h3>Histórico de revisões</h3>{historico(av)}</section>}
    </div>;
   })}
  </section>}
  {carregando===false&&disponiveis.length>0&&modo==="turma"&&<section className="card top-space">
   <h2>Grade de avaliação</h2><p className="muted small">Uma linha por aluno. Salve cada linha antes de sair; somente avaliações concluídas ficam bloqueadas.</p>
   <div style={{overflowX:"auto"}}>
    <table className="avaliacao-grade"><thead><tr><th>Aluno</th>{disponiveis.map(c=><th key={c.id}>{c.nome}<span className="muted small"> (peso {c.peso})</span></th>)}<th>Indicador</th><th>Status / Ações</th></tr></thead>
    <tbody>{alunosNaTurma.map(m=>{
      const av=avaliacaoDe(m.id),e=estadoDe(m.id);
      return <tr key={m.id}><th>{m.nome}</th>{disponiveis.map(c=><td key={c.id}>{celula(m,c)}</td>)}
       <td><strong>{formato(indicadorDe(m.id))}</strong></td>
       <td><div className="stack" style={{minWidth:145}}><span className="muted small">{av?.status==="concluida"?"Concluída":av?"Rascunho":"Não iniciada"}</span>
        {av?.status!=="concluida"?<><button disabled={salvando!==null} onClick={()=>void salvar(m.id,false)}>Salvar</button><button className="secondary" disabled={salvando!==null} onClick={()=>void salvar(m.id,true)}>Concluir</button></>:<button className="secondary" disabled={salvando!==null} onClick={()=>{setMatriculaId(m.id);setModo("individual");setReabrindo(null);}}>Ver / Revisar</button>}
       </div></td>
      </tr>;
    })}</tbody></table>
   </div>
  </section>}
  {!carregando&&alunosNaTurma.length===0&&<section className="card top-space"><p>Esta turma não possui matrículas ativas.</p><a href="/alunos">Cadastrar alunos</a></section>}
  <p className="muted small top-space">Avaliações concluídas permanecem bloqueadas até a reabertura com justificativa. O banco mantém snapshots da versão anterior e da versão corrigida.</p>
 </main>;
}
export default function AvaliacoesPage(){return <ProfessorShell>{user=><Tela user={user}/>}</ProfessorShell>;}
