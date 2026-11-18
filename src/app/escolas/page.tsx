"use client";
import { useEffect,useState } from "react";
import ProfessorShell from "@/components/ProfessorShell";
import { getSupabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Escola={id:string;nome:string};
function ListaEscolas({user}:{user:User}){
 const [escolas,setEscolas]=useState<Escola[]>([]);
 const [nome,setNome]=useState("");
 const [loading,setLoading]=useState(true);
 const [salvando,setSalvando]=useState(false);
 const [erro,setErro]=useState("");
 const [edicao,setEdicao]=useState<string|null>(null);
 async function carregar(){
   const {data,error}=await getSupabase().from("escolas").select("id,nome").eq("professor_id",user.id).order("nome");
   if(error)setErro(error.message);else setEscolas(data??[]);
   setLoading(false);
 }
 useEffect(()=>{void carregar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */},[user.id]);
 async function salvar(e:React.FormEvent){
  e.preventDefault();if(!nome.trim())return;
  setSalvando(true);setErro("");
  const api=getSupabase();
  const result=edicao?await api.from("escolas").update({nome:nome.trim()}).eq("id",edicao).eq("professor_id",user.id):await api.from("escolas").insert({nome:nome.trim(),professor_id:user.id});
  if(result.error)setErro(result.error.message);else {setNome("");setEdicao(null);await carregar();}
  setSalvando(false);
 }
 async function excluir(escola:Escola){
  if(!window.confirm("Excluir "+escola.nome+"? A operação pode afetar turmas vinculadas."))return;
  setErro("");
  const {error}=await getSupabase().from("escolas").delete().eq("id",escola.id).eq("professor_id",user.id);
  if(error)setErro(error.message);else await carregar();
 }
 return <main className="wrap pp-management pp-schools"><div className="pp-page-heading"><span className="pp-eyebrow">Organização pedagógica</span><h1>Minhas escolas</h1><p className="muted">Cadastre quantas escolas precisar. Cada conta visualiza apenas seus próprios registros.</p></div>
 <section className="card"><h2>{edicao?"Editar escola":"Nova escola"}</h2><form onSubmit={salvar} className="row pp-create-form"><label className="field" style={{flex:1}}>Nome da escola<input required maxLength={200} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex.: Escola Municipal Modelo"/></label><button disabled={salvando}>{salvando?"Salvando...":edicao?"Salvar alterações":"Cadastrar escola"}</button>{edicao&&<button className="secondary" type="button" onClick={()=>{setNome("");setEdicao(null);}}>Cancelar</button>}</form></section>
 {erro&&<p className="error" role="alert">{erro}</p>}
 <section className="card top-space"><h2>Escolas cadastradas ({escolas.length})</h2>{loading?<p>Carregando...</p>:escolas.length===0?<p className="muted">Nenhuma escola cadastrada ainda.</p>:<ul className="stack" style={{listStyle:"none",padding:0}}>{escolas.map(escola=><li className="row pp-list-row" key={escola.id}><strong>{escola.nome}</strong><div className="row"><button className="secondary" onClick={()=>{setEdicao(escola.id);setNome(escola.nome);window.scrollTo({top:0,behavior:"smooth"});}}>Editar</button><button className="secondary pp-danger-action" onClick={()=>void excluir(escola)}>Excluir</button></div></li>)}</ul>}</section></main>;
}
export default function EscolasPage(){return <ProfessorShell>{user=><ListaEscolas user={user}/>}</ProfessorShell>;}
