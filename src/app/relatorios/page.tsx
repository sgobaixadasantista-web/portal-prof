"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import ProfessorShell from "@/components/ProfessorShell";
import {getSupabase} from "@/lib/supabase";
import type {User} from "@supabase/supabase-js";

type Escola={id:string;nome:string};
type Turma={id:string;nome:string;ano_letivo:number;ano_escolar:number;escola_id:string;periodicidade:string};
type Disciplina={id:string;nome:string};
type Aluno={id:string;nome:string};
type Matricula={id:string;aluno_id:string;turma_id:string;ativo:boolean};
type Avaliacao={id:string;matricula_id:string;disciplina_id:string;periodo_rotulo:string;data_avaliacao:string;status:"rascunho"|"concluida";observacoes:string|null};
type Indicador={avaliacao_id:string;indicador:number|null;criterios_avaliados:number;total_criterios:number};
type Item={avaliacao_id:string;competencia_nome_snapshot:string;conceito:string;peso_aplicado:number};
type Linha={avaliacao:Avaliacao;aluno:string;turma:Turma;disciplina:string;nota:number|null;avaliadas:number;total:number};
type Modo="individual"|"turma"|"evolucao";
const nota=(v:number|null)=>v===null?"—":Number(v).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1});
const conceito=(v:string)=>({ruim:"Ruim",regular:"Regular",bom:"Bom",otimo:"Ótimo",nao_avaliado:"Não avaliado"} as Record<string,string>)[v]??v;
const dataBR=(v:string)=>{const [y,m,d]=v.split("-");return d&&m&&y?`${d}/${m}/${y}`:v;};
const escapeCsv=(v:unknown)=>`"${String(v??"").replace(/"/g,'""')}"`;
function exportarCsv(nome:string,cabecalho:string[],linhas:(string|number|null|undefined)[][]){
 const texto="\uFEFF"+[cabecalho,...linhas].map(l=>l.map(escapeCsv).join(";")).join("\r\n");
 const url=URL.createObjectURL(new Blob([texto],{type:"text/csv;charset=utf-8;"}));
 const a=document.createElement("a");a.href=url;a.download=nome+".csv";a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const criterioPeriodo=(s:string)=>{
 const inicio=s.match(/^(\d+)º (Bimestre|Trimestre) \/ (\d{4})$/);
 if(inicio)return Number(inicio[3])*100+Number(inicio[1])*(inicio[2]==="Bimestre"?25:33);
 const mensal=s.match(/^(\d{2})\/(\d{4})$/);
 if(mensal)return Number(mensal[2])*100+Number(mensal[1])*8;
 const semanal=s.match(/^Semana (\d+) \/ (\d{4})$/);
 if(semanal)return Number(semanal[2])*100+Number(semanal[1])*2;
 return 0;
};

function Relatorios({user}:{user:User}){
 const [escolas,setEscolas]=useState<Escola[]>([]);
 const [turmas,setTurmas]=useState<Turma[]>([]);
 const [disciplinas,setDisciplinas]=useState<Disciplina[]>([]);
 const [alunos,setAlunos]=useState<Aluno[]>([]);
 const [matriculas,setMatriculas]=useState<Matricula[]>([]);
 const [avaliacoes,setAvaliacoes]=useState<Avaliacao[]>([]);
 const [indicadores,setIndicadores]=useState<Indicador[]>([]);
 const [itens,setItens]=useState<Item[]>([]);
 const [carregando,setCarregando]=useState(true);
 const [erro,setErro]=useState("");
 const [modo,setModo]=useState<Modo>("turma");
 const [escolaId,setEscolaId]=useState("");
 const [turmaId,setTurmaId]=useState("");
 const [disciplinaId,setDisciplinaId]=useState("");
 const [alunoId,setAlunoId]=useState("");
 const [periodo,setPeriodo]=useState("");

 const carregar=useCallback(async()=>{
  setCarregando(true);setErro("");
  const api=getSupabase();
  // Todas as consultas carregam apenas dados pertencentes à conta autenticada.
  // RLS é a barreira de segurança; os filtros abaixo são adicionais.
  const [e,t,d,a,m,av,ind,it]=await Promise.all([
   api.from("escolas").select("id,nome").eq("professor_id",user.id),
   api.from("turmas").select("id,nome,ano_letivo,ano_escolar,escola_id,periodicidade").eq("professor_id",user.id),
   api.from("disciplinas").select("id,nome").eq("professor_id",user.id),
   api.from("alunos").select("id,nome").eq("professor_id",user.id),
   api.from("matriculas").select("id,aluno_id,turma_id,ativo").eq("professor_id",user.id),
   api.from("avaliacoes").select("id,matricula_id,disciplina_id,periodo_rotulo,data_avaliacao,status,observacoes").eq("professor_id",user.id).eq("status","concluida"),
   api.from("motor_v06_indicadores").select("avaliacao_id,indicador,criterios_avaliados,total_criterios").eq("professor_id",user.id).eq("status","concluida"),
   api.from("avaliacao_itens").select("avaliacao_id,competencia_nome_snapshot,conceito,peso_aplicado").eq("professor_id",user.id)
  ]);
  const falha=[e,t,d,a,m,av,ind,it].find(x=>x.error);
  if(falha?.error){setErro("Não foi possível carregar os relatórios: "+falha.error.message);}
  else{
   setEscolas(e.data??[]);setTurmas(t.data??[]);setDisciplinas(d.data??[]);
   setAlunos(a.data??[]);setMatriculas(m.data??[]);
   setAvaliacoes((av.data??[]) as Avaliacao[]);
   setIndicadores((ind.data??[]) as Indicador[]);
   setItens((it.data??[]) as Item[]);
  }
  setCarregando(false);
 },[user.id]);
 useEffect(()=>{void carregar();},[carregar]);

 const escolasOrdenadas=useMemo(()=>[...escolas].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")),[escolas]);
 const turmasFiltradas=useMemo(()=>turmas.filter(t=>!escolaId||t.escola_id===escolaId).sort((a,b)=>b.ano_letivo-a.ano_letivo||a.nome.localeCompare(b.nome,"pt-BR")),[turmas,escolaId]);
 const matriculasFiltradas=useMemo(()=>matriculas.filter(m=>(!turmaId||m.turma_id===turmaId)&&turmasFiltradas.some(t=>t.id===m.turma_id)),[matriculas,turmaId,turmasFiltradas]);
 const alunosFiltrados=useMemo(()=>alunos.filter(a=>matriculasFiltradas.some(m=>m.aluno_id===a.id)).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")),[alunos,matriculasFiltradas]);
 const periodos=useMemo(()=>Array.from(new Set(avaliacoes.filter(a=>matriculasFiltradas.some(m=>m.id===a.matricula_id)&&(!disciplinaId||a.disciplina_id===disciplinaId)).map(a=>a.periodo_rotulo))).sort((a,b)=>criterioPeriodo(a)-criterioPeriodo(b)||a.localeCompare(b,"pt-BR")),[avaliacoes,matriculasFiltradas,disciplinaId]);
 const linhas=useMemo<Linha[]>(()=>avaliacoes.flatMap(a=>{
  const matricula=matriculasFiltradas.find(m=>m.id===a.matricula_id);
  if(!matricula|| (disciplinaId&&a.disciplina_id!==disciplinaId)||(periodo&&a.periodo_rotulo!==periodo))return [];
  const turma=turmas.find(t=>t.id===matricula.turma_id);
  if(!turma)return [];
  const aluno=alunos.find(x=>x.id===matricula.aluno_id);
  if(!aluno)return [];
  if(alunoId&&alunoId!==aluno.id)return [];
  const indicador=indicadores.find(i=>i.avaliacao_id===a.id);
  return [{avaliacao:a,aluno:aluno.nome,turma,disciplina:disciplinas.find(x=>x.id===a.disciplina_id)?.nome??"Disciplina",nota:indicador?.indicador===null||indicador?.indicador===undefined?null:Number(indicador.indicador),avaliadas:Number(indicador?.criterios_avaliados??0),total:Number(indicador?.total_criterios??0)}];
 }).sort((a,b)=>a.aluno.localeCompare(b.aluno,"pt-BR")||a.disciplina.localeCompare(b.disciplina,"pt-BR")||criterioPeriodo(a.avaliacao.periodo_rotulo)-criterioPeriodo(b.avaliacao.periodo_rotulo)),[avaliacoes,matriculasFiltradas,disciplinaId,periodo,alunoId,turmas,alunos,indicadores,disciplinas]);
 const notasValidas=linhas.filter(x=>x.nota!==null);
 const media=notasValidas.length?notasValidas.reduce((s,l)=>s+(l.nota??0),0)/notasValidas.length:null;
 const qtdAlunos=new Set(linhas.map(x=>x.aluno+"|"+x.turma.id)).size;
 const titulo=modo==="individual"?"Relatório individual":modo==="turma"?"Relatório por turma":"Evolução por período";
 const nomeEscola=escolas.find(e=>e.id===escolaId)?.nome??"Todas as escolas";
 const nomeTurma=turmas.find(t=>t.id===turmaId)?.nome??"Todas as turmas";
 const nomeDisciplina=disciplinas.find(d=>d.id===disciplinaId)?.nome??"Todas as disciplinas";
 const alunoEscolhido=alunos.find(a=>a.id===alunoId)?.nome??"Todos os alunos";

 const excel=()=>{
  const prefixo="portal_professor_"+modo;
  const cab=["Escola","Turma","Ano letivo","Aluno","Disciplina","Período","Data","Indicador (0–10)","Competências avaliadas","Total de competências","Observações"];
  const base=linhas.map(l=>[escolas.find(e=>e.id===l.turma.escola_id)?.nome??"",l.turma.nome,l.turma.ano_letivo,l.aluno,l.disciplina,l.avaliacao.periodo_rotulo,dataBR(l.avaliacao.data_avaliacao),l.nota===null?"":nota(l.nota),l.avaliadas,l.total,l.avaliacao.observacoes??""]);
  if(modo==="individual"){
   const cabItens=[...cab,"Competência","Conceito","Peso aplicado"];
   const dados=linhas.flatMap((l,i)=>{
    const salvos=itens.filter(x=>x.avaliacao_id===l.avaliacao.id);
    return salvos.length?salvos.map(item=>[...base[i],item.competencia_nome_snapshot,conceito(item.conceito),item.peso_aplicado]):[[...base[i],"","",""]];
   });
   exportarCsv(prefixo,cabItens,dados);
  }else exportarCsv(prefixo,cab,base);
 };
 const imprimir=()=>window.print();

 return <main className="wrap relatorios">
  <div className="row relatorios-cabecalho"><div><h1>Relatórios e indicadores</h1><p className="muted">Somente avaliações concluídas da sua conta. Indicadores calculados pelo motor pedagógico V0.6.</p></div><button className="secondary" onClick={()=>void carregar()} disabled={carregando}>Atualizar dados</button></div>
  {erro&&<p className="error" role="alert">{erro}</p>}
  <section className="card filtros-relatorio">
   <div className="row" style={{justifyContent:"flex-start"}}>
    <button className={modo==="individual"?"":"secondary"} onClick={()=>{setModo("individual");setPeriodo("");}}>Individual</button>
    <button className={modo==="turma"?"":"secondary"} onClick={()=>setModo("turma")}>Turma</button>
    <button className={modo==="evolucao"?"":"secondary"} onClick={()=>{setModo("evolucao");setPeriodo("");}}>Evolução</button>
   </div>
   <div className="form-grid">
    <label className="field">Escola<select value={escolaId} onChange={ev=>{setEscolaId(ev.target.value);setTurmaId("");setAlunoId("");setPeriodo("");}}><option value="">Todas</option>{escolasOrdenadas.map(e=><option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
    <label className="field">Turma<select value={turmaId} onChange={ev=>{setTurmaId(ev.target.value);setAlunoId("");setPeriodo("");}}><option value="">Todas</option>{turmasFiltradas.map(t=><option key={t.id} value={t.id}>{t.nome} — {t.ano_letivo}</option>)}</select></label>
    <label className="field">Disciplina<select value={disciplinaId} onChange={ev=>{setDisciplinaId(ev.target.value);setPeriodo("");}}><option value="">Todas</option>{disciplinas.map(d=><option key={d.id} value={d.id}>{d.nome}</option>)}</select></label>
    <label className="field">Aluno<select value={alunoId} onChange={ev=>setAlunoId(ev.target.value)}><option value="">Todos</option>{alunosFiltrados.map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}</select></label>
    {modo!=="evolucao"&&<label className="field">Período<select value={periodo} onChange={ev=>setPeriodo(ev.target.value)}><option value="">Todos</option>{periodos.map(p=><option key={p} value={p}>{p}</option>)}</select></label>}
   </div>
  </section>
  {carregando?<section className="card top-space">Carregando relatórios...</section>:<div className="relatorio-impressao">
   <div className="row top-space relatorio-acoes"><span className="muted small">Exportações utilizam exclusivamente os dados filtrados e concluídos.</span><div className="row" style={{justifyContent:"flex-end"}}><button className="secondary" disabled={!linhas.length} onClick={excel}>Exportar Excel (CSV)</button><button disabled={!linhas.length} onClick={imprimir}>Salvar PDF / Imprimir</button></div></div>
   <section className="card top-space">
    <div className="relatorio-capa"><h2>{titulo}</h2><p className="muted small">{nomeEscola} · {nomeTurma} · {nomeDisciplina} · {alunoEscolhido}{periodo?" · "+periodo:""}</p><p className="muted small">Emitido em {new Date().toLocaleString("pt-BR")} · Conta: {user.email??"Professor autenticado"}</p></div>
    <div className="indicadores-resumo">
     <div><span className="muted small">Avaliações concluídas</span><strong>{linhas.length}</strong></div>
     <div><span className="muted small">Alunos avaliados</span><strong>{qtdAlunos}</strong></div>
     <div><span className="muted small">Média das avaliações</span><strong>{nota(media)} / 10,0</strong></div>
    </div>
    {!linhas.length?<p className="muted">Nenhuma avaliação concluída para os filtros selecionados.</p>:<>
     {modo==="individual"&&<div className="relatorio-entradas">{linhas.map(l=><article key={l.avaliacao.id} className="relatorio-bloco">
      <h3>{l.aluno} — {l.disciplina}</h3>
      <p className="muted small">{l.turma.nome} · {l.avaliacao.periodo_rotulo} · {dataBR(l.avaliacao.data_avaliacao)} · Indicador <strong>{nota(l.nota)} / 10,0</strong></p>
      <div className="relatorio-tabela-wrap"><table className="relatorio-tabela"><thead><tr><th>Competência</th><th>Conceito</th><th>Peso histórico</th></tr></thead><tbody>{itens.filter(i=>i.avaliacao_id===l.avaliacao.id).map((i,n)=><tr key={n}><td>{i.competencia_nome_snapshot}</td><td>{conceito(i.conceito)}</td><td>{i.peso_aplicado}</td></tr>)}</tbody></table></div>
      {l.avaliacao.observacoes&&<p><strong>Observações:</strong> {l.avaliacao.observacoes}</p>}
     </article>)}</div>}
     {modo==="turma"&&<div className="relatorio-tabela-wrap"><table className="relatorio-tabela"><thead><tr><th>Aluno</th><th>Turma</th><th>Disciplina</th><th>Período</th><th>Data</th><th>Indicador</th><th>Critérios</th></tr></thead><tbody>{linhas.map(l=><tr key={l.avaliacao.id}><td>{l.aluno}</td><td>{l.turma.nome} ({l.turma.ano_letivo})</td><td>{l.disciplina}</td><td>{l.avaliacao.periodo_rotulo}</td><td>{dataBR(l.avaliacao.data_avaliacao)}</td><td><strong>{nota(l.nota)}</strong></td><td>{l.avaliadas}/{l.total}</td></tr>)}</tbody></table></div>}
     {modo==="evolucao"&&<div className="relatorio-tabela-wrap"><table className="relatorio-tabela"><thead><tr><th>Aluno</th><th>Turma</th><th>Disciplina</th><th>Período</th><th>Indicador</th><th>Variação</th></tr></thead><tbody>{[...linhas].sort((a,b)=>a.aluno.localeCompare(b.aluno,"pt-BR")||a.disciplina.localeCompare(b.disciplina,"pt-BR")||criterioPeriodo(a.avaliacao.periodo_rotulo)-criterioPeriodo(b.avaliacao.periodo_rotulo)).map((l,_,arr)=>{
      const anteriores=arr.filter(x=>x.turma.id===l.turma.id&&x.aluno===l.aluno&&x.disciplina===l.disciplina&&criterioPeriodo(x.avaliacao.periodo_rotulo)<criterioPeriodo(l.avaliacao.periodo_rotulo)&&x.nota!==null);
      const anterior=anteriores.at(-1);
      const variacao=l.nota!==null&&anterior?.nota!==null&&anterior?.nota!==undefined?l.nota-anterior.nota:null;
      return <tr key={l.avaliacao.id}><td>{l.aluno}</td><td>{l.turma.nome} ({l.turma.ano_letivo})</td><td>{l.disciplina}</td><td>{l.avaliacao.periodo_rotulo}</td><td><strong>{nota(l.nota)}</strong></td><td>{variacao===null?"—":(variacao>0?"+":"")+nota(variacao)}</td></tr>;
     })}</tbody></table></div>}
    </>}
    <p className="muted small top-space">Indicadores de 0 a 10. Conceitos: Ruim 2,5 · Regular 5,0 · Bom 7,5 · Ótimo 10,0; competências não avaliadas não entram no cálculo. A média geral é a média simples dos indicadores das avaliações listadas, e não um conceito consolidado por aluno.</p>
   </section>
  </div>}
 </main>;
}
export default function RelatoriosPage(){return <ProfessorShell>{user=><Relatorios user={user}/>}</ProfessorShell>;}
