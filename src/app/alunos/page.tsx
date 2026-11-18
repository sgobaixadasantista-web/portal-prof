"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import ProfessorShell from "@/components/ProfessorShell";
import { getSupabase } from "@/lib/supabase";

type Escola = {id:string;nome:string};
type Turma = {id:string;nome:string;escola_id:string;ano_letivo:number;ano_escolar:number};
type Aluno = {id:string;nome:string};
type Matricula = {id:string;aluno_id:string;turma_id:string;ativo:boolean};
type Linha = {id:string;nome:string;ativo:boolean};
type Modo = "individual" | "lista" | "excel";

const normalizar = (nome:string) => nome.normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().replace(/\s+/g," ").toLocaleLowerCase("pt-BR");
const limparNome = (nome:string) => nome.trim().replace(/\s+/g," ");
const MAX_ALUNOS = 300;

function CadastroAlunos({user}:{user:User}) {
 const [escolas,setEscolas] = useState<Escola[]>([]);
 const [turmas,setTurmas] = useState<Turma[]>([]);
 const [alunos,setAlunos] = useState<Aluno[]>([]);
 const [matriculas,setMatriculas] = useState<Matricula[]>([]);
 const [turmaId,setTurmaId] = useState("");
 const [modo,setModo] = useState<Modo>("individual");
 const [nome,setNome] = useState("");
 const [lista,setLista] = useState("");
 const [importados,setImportados] = useState<string[]>([]);
 const [arquivo,setArquivo] = useState("");
 const [busca,setBusca] = useState("");
 const [editando,setEditando] = useState<string|null>(null);
 const [editNome,setEditNome] = useState("");
 const [carregando,setCarregando] = useState(true);
 const [salvando,setSalvando] = useState(false);
 const [erro,setErro] = useState("");
 const [aviso,setAviso] = useState("");

 const carregar = useCallback(async()=>{
   setCarregando(true);
   const api=getSupabase();
   const [e,t,a,m]=await Promise.all([
     api.from("escolas").select("id,nome").eq("professor_id",user.id).order("nome"),
     api.from("turmas").select("id,nome,escola_id,ano_letivo,ano_escolar").eq("professor_id",user.id).order("ano_letivo",{ascending:false}).order("nome"),
     api.from("alunos").select("id,nome").eq("professor_id",user.id).order("nome"),
     api.from("matriculas").select("id,aluno_id,turma_id,ativo").eq("professor_id",user.id)
   ]);
   if(e.error||t.error||a.error||m.error){
     setErro(e.error?.message??t.error?.message??a.error?.message??m.error?.message??"Erro ao carregar alunos.");
   } else {
     setEscolas((e.data??[]) as Escola[]);
     setTurmas((t.data??[]) as Turma[]);
     setAlunos((a.data??[]) as Aluno[]);
     setMatriculas((m.data??[]) as Matricula[]);
   }
   setCarregando(false);
 },[user.id]);
 useEffect(()=>{void carregar();},[carregar]);
 useEffect(()=>{
   if(turmas.length && !turmas.some(t=>t.id===turmaId))setTurmaId(turmas[0].id);
 },[turmas,turmaId]);

 const turma=turmas.find(t=>t.id===turmaId);
 const registros: Linha[]=useMemo(()=>{
   const porId=new Map(alunos.map(a=>[a.id,a]));
   return matriculas.filter(m=>m.turma_id===turmaId).map(m=>({
     id:m.aluno_id,nome:porId.get(m.aluno_id)?.nome??"Aluno não encontrado",ativo:m.ativo
   })).filter(a=>normalizar(a.nome).includes(normalizar(busca)))
     .sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
 },[alunos,matriculas,turmaId,busca]);
 const candidatos = modo==="individual" ? [nome] : modo==="lista" ? lista.split(/\r?\n/) : importados;
 const nomesExistentes=new Set(matriculas.filter(m=>m.turma_id===turmaId)
   .map(m=>alunos.find(a=>a.id===m.aluno_id)?.nome).filter((n):n is string=>!!n).map(normalizar));
 const validacao=useMemo(()=>{
   const validos:string[]=[];const duplicados:string[]=[];const invalidos:string[]=[];
   const vistos=new Set<string>();
   for(const bruto of candidatos) {
     const n=limparNome(bruto);
     if(!n) continue;
     if(n.length>200){invalidos.push(n);continue;}
     const chave=normalizar(n);
     if(vistos.has(chave)||nomesExistentes.has(chave)){duplicados.push(n);continue;}
     vistos.add(chave);validos.push(n);
   }
   return {validos,duplicados,invalidos};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[modo,nome,lista,importados,alunos,matriculas,turmaId]);

 async function lerExcel(event:React.ChangeEvent<HTMLInputElement>) {
   const file=event.target.files?.[0];setErro("");setAviso("");
   if(!file)return;
   if(!file.name.toLowerCase().endsWith(".xlsx")){setErro("Utilize uma planilha .xlsx.");return;}
   if(file.size>2*1024*1024){setErro("Arquivo muito grande. Limite: 2 MB.");return;}
   try{
     const {readSheet}=await import("read-excel-file/browser");
     const rows=await readSheet(file, 1);
     if(rows.length>1000)throw new Error("A planilha ultrapassa 1.000 linhas.");
     const raw=rows.map(row=>String(row[0]??"").trim()).filter(Boolean);
     if(raw.length && ["nome","nome do aluno","aluno","alunos"].includes(normalizar(raw[0])))raw.shift();
     setImportados(raw);
     setArquivo(file.name);
   }catch(e){setErro(e instanceof Error?e.message:"Não foi possível ler a planilha.");setImportados([]);}
   event.target.value="";
 }
 async function cadastrar(event:React.FormEvent){
   event.preventDefault();setErro("");setAviso("");
   if(!turma){setErro("Selecione uma turma.");return;}
   const {validos,duplicados,invalidos}=validacao;
   if(invalidos.length){setErro("Existem nomes acima de 200 caracteres.");return;}
   if(!validos.length){setErro("Nenhum nome novo para cadastrar.");return;}
   if(validos.length>MAX_ALUNOS){setErro("Importe até 300 alunos por operação.");return;}
   setSalvando(true);
   const api=getSupabase();
   const falhas:string[]=[];
   let adicionados=0;
   // Cada aluno recebe UUID. Em caso de falha na matrícula, remove o aluno recém-criado.
   // Nenhuma conta, avaliação ou matrícula existente é apagada.
   for(const novoNome of validos){
     const {data:aluno,error:erroAluno}=await api.from("alunos")
       .insert({professor_id:user.id,nome:novoNome}).select("id").single();
     if(erroAluno||!aluno){falhas.push(novoNome+": "+(erroAluno?.message??"Falha no cadastro"));continue;}
     const {error:erroMatricula}=await api.from("matriculas").insert({
       professor_id:user.id,aluno_id:aluno.id,turma_id:turma.id,ativo:true
     });
     if(erroMatricula){
       // Best effort: evitar aluno órfão sem matrícula.
       await api.from("alunos").delete().eq("id",aluno.id).eq("professor_id",user.id);
       falhas.push(novoNome+": "+erroMatricula.message);
     }else adicionados++;
   }
   await carregar();setSalvando(false);
   if(falhas.length)setErro("Falha em "+falhas.length+" registro(s): "+falhas.slice(0,3).join("; ")+(falhas.length>3?"…":""));
   if(adicionados){
     setAviso(adicionados+" aluno(s) cadastrado(s)."+(duplicados.length?" "+duplicados.length+" nome(s) duplicado(s) ignorado(s).":""));
     setNome("");setLista("");setImportados([]);setArquivo("");
   }
 }
 async function salvarNome(id:string){
   const novo=limparNome(editNome);
   if(!novo||novo.length>200){setErro("Informe um nome válido, com até 200 caracteres.");return;}
   if(registros.some(a=>a.id!==id&&normalizar(a.nome)===normalizar(novo))){
     setErro("Outro aluno já possui esse nome na turma.");return;
   }
   setSalvando(true);setErro("");setAviso("");
   const {error}=await getSupabase().from("alunos").update({nome:novo})
     .eq("id",id).eq("professor_id",user.id);
   if(error)setErro(error.message);
   else {setEditando(null);setAviso("Nome atualizado.");await carregar();}
   setSalvando(false);
 }
 async function alternarAtivo(id:string,ativo:boolean){
   const m=matriculas.find(x=>x.aluno_id===id&&x.turma_id===turmaId);
   if(!m)return;
   setSalvando(true);setErro("");setAviso("");
   const {error}=await getSupabase().from("matriculas")
     .update({ativo:!ativo}).eq("id",m.id).eq("professor_id",user.id);
   if(error)setErro(error.message);
   else {setAviso(!ativo?"Matrícula reativada.":"Matrícula inativada, histórico preservado.");await carregar();}
   setSalvando(false);
 }
 return <main className="wrap">
   <div className="row"><div><h1>Cadastro de alunos</h1><p className="muted">Apenas o nome do aluno será cadastrado. O vínculo com a turma é mantido em matrícula separada.</p></div>
     <Link href="/turmas">Gerenciar turmas</Link></div>
   {erro&&<p role="alert" className="error">{erro}</p>}
   {aviso&&<p role="status" className="success">{aviso}</p>}
   {turmas.length===0&&!carregando?<section className="card"><p>Cadastre uma turma antes de incluir alunos.</p><Link href="/turmas">Cadastrar turma</Link></section>:<>
   <section className="card">
     <label className="field">Turma
       <select value={turmaId} onChange={e=>{setTurmaId(e.target.value);setErro("");setAviso("");}}>
         {turmas.map(t=><option key={t.id} value={t.id}>{escolas.find(e=>e.id===t.escola_id)?.nome??"Escola"} — {t.nome} ({t.ano_letivo})</option>)}
       </select>
     </label>
   </section>
   <section className="card top-space">
     <h2>Adicionar alunos</h2>
     <div className="row" style={{justifyContent:"flex-start"}}>
       {([["individual","Individual"],["lista","Em lote"],["excel","Importar Excel"]] as const).map(([v,l])=>
         <button key={v} type="button" className={modo===v?"":"secondary"} onClick={()=>{setModo(v);setErro("");}}>{l}</button>)}
     </div>
     <form onSubmit={cadastrar}>
       {modo==="individual"&&<label className="field">Nome do aluno<input value={nome} maxLength={200} onChange={e=>setNome(e.target.value)} placeholder="Nome completo" autoComplete="off"/></label>}
       {modo==="lista"&&<label className="field">Cole os nomes (um por linha)<textarea rows={9} value={lista} onChange={e=>setLista(e.target.value)} placeholder={"Ana Silva\nBruno Souza\nCarla Santos"}/></label>}
       {modo==="excel"&&<div className="field"><label htmlFor="excel-alunos">Planilha Excel (.xlsx)</label>
         <input id="excel-alunos" type="file" accept=".xlsx" onChange={e=>void lerExcel(e)}/>
         <p className="muted small">Use a primeira coluna para os nomes; cabeçalho “Nome” é opcional. O arquivo é lido no navegador e somente os nomes são cadastrados.</p>
         {arquivo&&<p>{arquivo}: {importados.length} linha(s) encontrada(s).</p>}
       </div>}
       <div className="row" style={{justifyContent:"flex-start"}}>
         <span className="success small">{validacao.validos.length} novo(s)</span>
         {validacao.duplicados.length>0&&<span className="muted small">{validacao.duplicados.length} duplicado(s) ignorado(s)</span>}
         {validacao.invalidos.length>0&&<span className="error small">{validacao.invalidos.length} nome(s) inválido(s)</span>}
       </div>
       <button className="top-space" disabled={salvando||!turma||validacao.validos.length===0||validacao.invalidos.length>0}>
         {salvando?"Salvando alunos...":"Cadastrar aluno(s)"}
       </button>
     </form>
   </section>
   <section className="card top-space">
     <div className="row"><h2>Alunos da turma ({registros.length})</h2>
       <label className="field" style={{minWidth:230}}>Pesquisar
         <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Nome do aluno"/>
       </label>
     </div>
     {carregando?<p>Carregando...</p>:registros.length===0?<p className="muted">Nenhum aluno encontrado nesta turma.</p>:
       <div className="turma-lista">{registros.map(a=><div key={a.id} className="turma-item">
         {editando===a.id?<div style={{flex:1}}>
           <label className="field">Editar nome<input value={editNome} maxLength={200} onChange={e=>setEditNome(e.target.value)}/></label>
           <div className="row" style={{justifyContent:"flex-start"}}>
             <button disabled={salvando} onClick={()=>void salvarNome(a.id)}>Salvar</button>
             <button className="secondary" onClick={()=>setEditando(null)}>Cancelar</button>
           </div>
         </div>:<><div><strong>{a.nome}</strong><p className="muted small">{a.ativo?"Matrícula ativa":"Matrícula inativa"}</p></div>
         <div className="row" style={{justifyContent:"flex-end"}}>
           <button className="secondary" disabled={salvando} onClick={()=>{setEditando(a.id);setEditNome(a.nome);}}>Editar</button>
           <button className="secondary" disabled={salvando} onClick={()=>void alternarAtivo(a.id,a.ativo)}>
             {a.ativo?"Inativar":"Reativar"}
           </button>
         </div></>}
       </div>)}</div>}
   </section></>}
 </main>;
}
export default function AlunosPage(){
 return <ProfessorShell>{user=><CadastroAlunos user={user}/>}</ProfessorShell>;
}
