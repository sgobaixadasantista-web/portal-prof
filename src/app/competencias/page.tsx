"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import type {User} from "@supabase/supabase-js";
import ProfessorShell from "@/components/ProfessorShell";
import {getSupabase} from "@/lib/supabase";

type Disciplina={id:string;nome:string};
type Modelo={id:string;disciplina_nome:string;ano_escolar:number;titulo:string;descricao:string|null;codigo_bncc:string|null};
type Competencia={id:string;disciplina_id:string;modelo_id:string|null;nome:string;descricao:string|null;ano_escolar:number|null;ativa:boolean};
type Turma={id:string;nome:string;ano_escolar:number;ano_letivo:number;escola_id:string};
type Vinculo={id:string;turma_id:string;competencia_id:string;peso:number;ativa:boolean};
type Escola={id:string;nome:string};
type Secao="configurar"|"biblioteca"|"disciplinas";
const padrao=["Língua Portuguesa","Matemática","Ciências","História","Geografia","Arte","Educação Física","Inglês"];
const formatarErro=(e:unknown)=>e instanceof Error?e.message:String(e);
function Configurador({user}:{user:User}){
 const [disciplinas,setDisciplinas]=useState<Disciplina[]>([]);
 const [modelos,setModelos]=useState<Modelo[]>([]);
 const [competencias,setCompetencias]=useState<Competencia[]>([]);
 const [turmas,setTurmas]=useState<Turma[]>([]);
 const [escolas,setEscolas]=useState<Escola[]>([]);
 const [vinculos,setVinculos]=useState<Vinculo[]>([]);
 const [secao,setSecao]=useState<Secao>("configurar");
 const [turmaId,setTurmaId]=useState("");
 const [disciplinaId,setDisciplinaId]=useState("");
 const [anoFiltro,setAnoFiltro]=useState("3");
 const [nomeDisciplina,setNomeDisciplina]=useState("");
 const [novoNome,setNovoNome]=useState("");
 const [novaDescricao,setNovaDescricao]=useState("");
 const [pesoInicial,setPesoInicial]=useState("1");
 const [erro,setErro]=useState("");
 const [aviso,setAviso]=useState("");
 const [carregando,setCarregando]=useState(true);
 const [ocupado,setOcupado]=useState(false);
 const [pesos,setPesos]=useState<Record<string,string>>({});
 const [alterando,setAlterando]=useState<string|null>(null);
 const [nomeEdicao,setNomeEdicao]=useState("");
 const [descricaoEdicao,setDescricaoEdicao]=useState("");
 
 const carregar=useCallback(async()=>{
  setCarregando(true);
  const api=getSupabase();
  const [d,m,c,t,e,v]=await Promise.all([
    api.from("disciplinas").select("id,nome").eq("professor_id",user.id).order("nome"),
    api.from("competencias_modelo").select("id,disciplina_nome,ano_escolar,titulo,descricao,codigo_bncc").eq("ativa",true).order("titulo"),
    api.from("competencias").select("id,disciplina_id,modelo_id,nome,descricao,ano_escolar,ativa").eq("professor_id",user.id).order("nome"),
    api.from("turmas").select("id,nome,ano_escolar,ano_letivo,escola_id").eq("professor_id",user.id).order("ano_letivo",{ascending:false}),
    api.from("escolas").select("id,nome").eq("professor_id",user.id),
    api.from("turma_competencias").select("id,turma_id,competencia_id,peso,ativa").eq("professor_id",user.id)
  ]);
  const falha=d.error||m.error||c.error||t.error||e.error||v.error;
  if(falha)setErro(falha.message);
  else{
   setDisciplinas(d.data??[]);
   setModelos(m.data??[]);
   setCompetencias(c.data??[]);
   setTurmas(t.data??[]);
   setEscolas(e.data??[]);
   setVinculos(v.data??[]);
  }
  setCarregando(false);
 },[user.id]);
 useEffect(()=>{void carregar();},[carregar]);
 useEffect(()=>{if(turmas.length&&!turmas.some(t=>t.id===turmaId))setTurmaId(turmas[0].id);},[turmas,turmaId]);
 useEffect(()=>{if(disciplinas.length&&!disciplinas.some(d=>d.id===disciplinaId))setDisciplinaId(disciplinas[0].id);},[disciplinas,disciplinaId]);
 const turma=turmas.find(t=>t.id===turmaId);
 const disciplina=disciplinas.find(d=>d.id===disciplinaId);
 const ano=turma?.ano_escolar??Number(anoFiltro);
 const minhas=useMemo(()=>competencias.filter(c=>c.disciplina_id===disciplinaId&&(c.ano_escolar===null||c.ano_escolar===ano)),[competencias,disciplinaId,ano]);
 const biblioteca=useMemo(()=>modelos.filter(m=>m.disciplina_nome===disciplina?.nome&&m.ano_escolar===ano),[modelos,disciplina,ano]);
 const vinculadas=useMemo(()=>vinculos.filter(v=>v.turma_id===turmaId),[vinculos,turmaId]);
 const vinculoDe=(id:string)=>vinculadas.find(v=>v.competencia_id===id);
 const totalPeso=vinculadas.filter(v=>v.ativa&&minhas.some(c=>c.id===v.competencia_id&&c.ativa)).reduce((s,v)=>s+Number(v.peso),0);
 function mensagem(texto:string){setAviso(texto);setErro("");}
 async function salvarDisciplina(e:React.FormEvent){
  e.preventDefault();const nome=nomeDisciplina.trim();
  if(!nome)return;
  if(disciplinas.some(d=>d.nome.toLocaleLowerCase("pt-BR")===nome.toLocaleLowerCase("pt-BR"))){setErro("Disciplina já cadastrada.");return;}
  setOcupado(true);setErro("");
  const {error}=await getSupabase().from("disciplinas").insert({professor_id:user.id,nome});
  if(error)setErro(error.message);else{setNomeDisciplina("");await carregar();mensagem("Disciplina cadastrada.");}
  setOcupado(false);
 }
 async function inserirPadrao(){
  setOcupado(true);setErro("");
  const faltantes=padrao.filter(nome=>!disciplinas.some(d=>d.nome===nome));
  if(faltantes.length===0){setOcupado(false);mensagem("Todas as disciplinas iniciais já estão cadastradas.");return;}
  const {error}=await getSupabase().from("disciplinas").insert(faltantes.map(nome=>({professor_id:user.id,nome})));
  if(error)setErro(error.message);else{await carregar();mensagem(faltantes.length+" disciplinas iniciais cadastradas.");}
  setOcupado(false);
 }
 async function importarModelo(modelo:Modelo){
  if(!disciplina){setErro("Selecione uma disciplina.");return;}
  setOcupado(true);setErro("");
  let competencia=competencias.find(c=>c.modelo_id===modelo.id&&c.disciplina_id===disciplina.id);
  if(!competencia){
   const {data,error}=await getSupabase().from("competencias").insert({
    professor_id:user.id,disciplina_id:disciplina.id,modelo_id:modelo.id,
    nome:modelo.titulo,descricao:modelo.descricao,ano_escolar:modelo.ano_escolar,ativa:true
   }).select("id,disciplina_id,modelo_id,nome,descricao,ano_escolar,ativa").single();
   if(error){setErro(error.message);setOcupado(false);return;}
   competencia=data as Competencia;
  }
  if(turma&&competencia&&!vinculoDe(competencia.id)){
   const {error}=await getSupabase().from("turma_competencias").insert({
    professor_id:user.id,turma_id:turma.id,competencia_id:competencia.id,peso:1,ativa:true
   });
   if(error)setErro(error.message);
   else mensagem("Competência importada e vinculada à turma.");
  }else mensagem("Competência importada à sua biblioteca pessoal.");
  await carregar();setOcupado(false);
 }
 async function novaCompetencia(e:React.FormEvent){
  e.preventDefault();if(!disciplina||!novoNome.trim()){setErro("Informe disciplina e competência.");return;}
  const peso=Number(pesoInicial);
  if(!Number.isFinite(peso)||peso<0||peso>100){setErro("Peso deve ficar entre 0 e 100.");return;}
  setOcupado(true);setErro("");
  const api=getSupabase();
  const {data,error}=await api.from("competencias").insert({
   professor_id:user.id,disciplina_id:disciplina.id,nome:novoNome.trim(),
   descricao:novaDescricao.trim()||null,ano_escolar:ano,ativa:true
  }).select("id").single();
  if(error){setErro(error.message);setOcupado(false);return;}
  if(turma){
   const vinculo=await api.from("turma_competencias").insert({
    professor_id:user.id,turma_id:turma.id,competencia_id:data.id,peso,ativa:true
   });
   if(vinculo.error)setErro("Competência criada, mas não vinculada: "+vinculo.error.message);
   else mensagem("Competência personalizada criada e vinculada.");
  }else mensagem("Competência personalizada cadastrada.");
  setNovoNome("");setNovaDescricao("");setPesoInicial("1");await carregar();setOcupado(false);
 }
 async function alternarVinculo(c:Competencia){
  if(!turma){setErro("Selecione uma turma.");return;}
  setOcupado(true);setErro("");
  const api=getSupabase();const vinculo=vinculoDe(c.id);
  const result=vinculo?
   await api.from("turma_competencias").update({ativa:!vinculo.ativa}).eq("id",vinculo.id).eq("professor_id",user.id):
   await api.from("turma_competencias").insert({professor_id:user.id,turma_id:turma.id,competencia_id:c.id,peso:1,ativa:true});
  if(result.error)setErro(result.error.message);
  else{await carregar();mensagem(vinculo?(vinculo.ativa?"Competência desativada na turma.":"Competência ativada na turma."):"Competência vinculada à turma.");}
  setOcupado(false);
 }
 async function atualizarPeso(v:Vinculo){
  const valor=Number(pesos[v.id]??v.peso);
  if(!Number.isFinite(valor)||valor<0||valor>100){setErro("O peso deve ficar entre 0 e 100.");return;}
  setOcupado(true);setErro("");
  const {error}=await getSupabase().from("turma_competencias").update({peso:valor}).eq("id",v.id).eq("professor_id",user.id);
  if(error)setErro(error.message);else{await carregar();mensagem("Peso atualizado.");}
  setOcupado(false);
 }
 async function salvarEdicao(c:Competencia){
  if(!nomeEdicao.trim()){setErro("Informe o nome.");return;}
  setOcupado(true);setErro("");
  const {error}=await getSupabase().from("competencias").update({nome:nomeEdicao.trim(),descricao:descricaoEdicao.trim()||null}).eq("id",c.id).eq("professor_id",user.id);
  if(error)setErro(error.message);else{setAlterando(null);await carregar();mensagem("Competência atualizada.");}
  setOcupado(false);
 }
 return <main className="wrap">
  <h1>Disciplinas e competências</h1>
  <p className="muted">Configure os critérios pedagógicos do 1º ao 5º ano e seus pesos por turma. Os conceitos de avaliação continuarão fixos.</p>
  <div className="row" style={{justifyContent:"flex-start",marginBottom:18}}>
   {([["configurar","Configurar turma"],["biblioteca","Biblioteca de modelos"],["disciplinas","Disciplinas"]] as const).map(([v,l])=>
    <button key={v} className={secao===v?"":"secondary"} onClick={()=>setSecao(v)}>{l}</button>)}
  </div>
  {erro&&<p role="alert" className="error">{erro}</p>}
  {aviso&&<p role="status" className="success">{aviso}</p>}
  {carregando&&<p className="muted">Carregando registros...</p>}
  {secao==="disciplinas"?<section className="card">
   <h2>Minhas disciplinas</h2>
   <p className="muted">Use a lista inicial ou adicione outras disciplinas.</p>
   <button className="secondary" disabled={ocupado} onClick={()=>void inserirPadrao()}>Adicionar disciplinas iniciais</button>
   <form onSubmit={salvarDisciplina} className="row" style={{alignItems:"end"}}>
    <label className="field" style={{flex:1}}>Nome da disciplina<input maxLength={100} value={nomeDisciplina} onChange={e=>setNomeDisciplina(e.target.value)} placeholder="Ex.: Língua Portuguesa" required/></label>
    <button disabled={ocupado}>Cadastrar</button>
   </form>
   <div className="turma-lista">{disciplinas.map(d=><div className="turma-item" key={d.id}><strong>{d.nome}</strong><span className="muted small">{competencias.filter(c=>c.disciplina_id===d.id).length} competências pessoais</span></div>)}</div>
  </section>:<>
  <section className="card"><div className="form-grid">
   <label className="field">Turma
    <select value={turmaId} onChange={e=>setTurmaId(e.target.value)}>
     {turmas.length===0&&<option value="">Nenhuma turma</option>}
     {turmas.map(t=><option key={t.id} value={t.id}>{escolas.find(e=>e.id===t.escola_id)?.nome??"Escola"} — {t.nome} · {t.ano_letivo}</option>)}
    </select>
   </label>
   <label className="field">Disciplina
    <select value={disciplinaId} onChange={e=>setDisciplinaId(e.target.value)}>
     {disciplinas.length===0&&<option value="">Cadastre disciplinas primeiro</option>}
     {disciplinas.map(d=><option key={d.id} value={d.id}>{d.nome}</option>)}
    </select>
   </label>
   {!turma&&<label className="field">Ano escolar (biblioteca)<select value={anoFiltro} onChange={e=>setAnoFiltro(e.target.value)}>
    {[1,2,3,4,5].map(a=><option key={a} value={a}>{a}º ano</option>)}
   </select></label>}
  </div>
  {!disciplinas.length&&<p><button className="secondary" onClick={()=>setSecao("disciplinas")}>Cadastrar disciplinas</button></p>}
  {!turmas.length&&<p>Cadastre uma turma em <a href="/turmas">Minhas turmas</a>.</p>}
  </section>
  {secao==="biblioteca"?<section className="card top-space">
   <h2>Modelos para {ano}º ano</h2>
   <p className="muted">Modelos pedagógicos iniciais. Sem código BNCC até validação individual de cada habilidade.</p>
   {biblioteca.length===0?<p>Nenhum modelo disponível para esta disciplina e ano. Execute o SQL inicial no Supabase.</p>:<div className="turma-lista">
    {biblioteca.map(m=><div className="turma-item" key={m.id}><div style={{flex:1}}><strong>{m.titulo}</strong>{m.descricao&&<p className="muted small">{m.descricao}</p>}{m.codigo_bncc&&<p className="small">BNCC: {m.codigo_bncc}</p>}</div>
     <button disabled={ocupado||!disciplina} onClick={()=>void importarModelo(m)} className="secondary">
      {competencias.some(c=>c.modelo_id===m.id)?"Reutilizar":"Importar"}
     </button></div>)}</div>}
  </section>:<>
  <section className="card top-space">
   <h2>Criar competência personalizada</h2>
   <form onSubmit={novaCompetencia}>
    <div className="form-grid">
     <label className="field">Nome da competência<input value={novoNome} maxLength={200} onChange={e=>setNovoNome(e.target.value)} required placeholder="Ex.: Interpretação de texto"/></label>
     <label className="field">Peso inicial<input type="number" min="0" max="100" step="0.5" value={pesoInicial} onChange={e=>setPesoInicial(e.target.value)} /></label>
    </div>
    <label className="field">Descrição (opcional)<textarea rows={3} value={novaDescricao} onChange={e=>setNovaDescricao(e.target.value)} placeholder="Critério observado pelo professor"/></label>
    <button disabled={ocupado||!disciplina}>Adicionar competência</button>
   </form>
  </section>
  <section className="card top-space">
   <div className="row"><h2>Competências configuradas</h2><span className="muted small">Peso total ativo: {totalPeso.toLocaleString("pt-BR")}</span></div>
   <p className="muted small">Os pesos não precisam somar 100. O indicador será a média ponderada entre os critérios avaliados.</p>
   {minhas.length===0?<p className="muted">Ainda não há competências pessoais. Importe modelos ou crie uma competência.</p>:
   <div className="turma-lista">{minhas.map(c=>{
    const v=vinculoDe(c.id);
    return <div className="turma-item" key={c.id}>
     <div style={{flex:1,minWidth:220}}>
      {alterando===c.id?<div className="stack">
       <label className="field">Nome<input value={nomeEdicao} maxLength={200} onChange={e=>setNomeEdicao(e.target.value)}/></label>
       <label className="field">Descrição<textarea rows={2} value={descricaoEdicao} onChange={e=>setDescricaoEdicao(e.target.value)}/></label>
       <div className="row" style={{justifyContent:"flex-start"}}><button disabled={ocupado} onClick={()=>void salvarEdicao(c)}>Salvar</button><button className="secondary" onClick={()=>setAlterando(null)}>Cancelar</button></div>
      </div>:<>
       <strong>{c.nome}</strong><p className="muted small">{c.descricao??"Sem descrição"} · {c.modelo_id?"Modelo importado":"Personalizada"}</p>
       <span className="small">{v?(v.ativa?"Ativa nesta turma":"Inativa nesta turma"):"Não vinculada à turma"}</span>
      </>}
     </div>
     {alterando!==c.id&&<div className="row" style={{justifyContent:"flex-end"}}>
      {v&&<label className="field" style={{width:105,margin:0}}>Peso<input type="number" min="0" max="100" step="0.5" value={pesos[v.id]??String(v.peso)} onChange={e=>setPesos(s=>({...s,[v.id]:e.target.value}))}/></label>}
      {v&&<button disabled={ocupado} className="secondary" onClick={()=>void atualizarPeso(v)}>Salvar peso</button>}
      <button disabled={ocupado||!turma} className="secondary" onClick={()=>void alternarVinculo(c)}>{v?.ativa?"Desativar":"Ativar"}</button>
      <button className="secondary" onClick={()=>{setAlterando(c.id);setNomeEdicao(c.nome);setDescricaoEdicao(c.descricao??"");}}>Editar</button>
     </div>}
    </div>;
   })}</div>}
  </section></>}
  </>}
 </main>;
}
export default function CompetenciasPage(){return <ProfessorShell>{user=><Configurador user={user}/>}</ProfessorShell>;}
