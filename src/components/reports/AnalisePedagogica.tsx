"use client";

import {useMemo,useState} from "react";

export type RegistroPedagogico={
 matriculaId:string;aluno:string;turmaId:string;turma:string;anoLetivo:number;
 disciplinaId:string;disciplina:string;periodo:string;nota:number|null;
};

const formatar=(n:number|null)=>n===null?"—":n.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1});
const legivel=(s:string)=>s.toLocaleLowerCase("pt-BR").replace(/(^|[ -])([a-zà-ÿ])/g,(_,prefix:string,letra:string)=>prefix+letra.toLocaleUpperCase("pt-BR"));

function ordemPeriodo(rotulo:string):number{
 const b=rotulo.match(/^(\d+)º (Bimestre|Trimestre) \/ (\d{4})$/);
 if(b)return Number(b[3])*1000+(b[2]==="Bimestre"?Number(b[1])*250:Number(b[1])*333);
 const m=rotulo.match(/^(\d{2})\/(\d{4})$/);
 if(m)return Number(m[2])*1000+Number(m[1])*80;
 const s=rotulo.match(/^Semana (\d+) \/ (\d{4})$/);
 if(s)return Number(s[2])*1000+Number(s[1])*19;
 return 0;
}
const media=(notas:(number|null)[])=>{
 const validas=notas.filter((n):n is number=>n!==null);
 return validas.length?validas.reduce((s,n)=>s+n,0)/validas.length:null;
};

export function BoletimConsolidado({registros}:{registros:RegistroPedagogico[]}){
 const [busca,setBusca]=useState("");
 const [pagina,setPagina]=useState(1);
 const disciplinas=useMemo(()=>Array.from(new Map(registros.map(x=>[x.disciplinaId,{id:x.disciplinaId,nome:x.disciplina}])).values()).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")),[registros]);
 const grupos=useMemo(()=>{
  const map=new Map<string,{matriculaId:string;aluno:string;turma:string;periodo:string;notas:Map<string,number|null>}>();
  for(const r of registros){
   const key=r.matriculaId+"|"+r.periodo;
   if(!map.has(key))map.set(key,{matriculaId:r.matriculaId,aluno:r.aluno,turma:r.turma+" · "+r.anoLetivo,periodo:r.periodo,notas:new Map()});
   map.get(key)!.notas.set(r.disciplinaId,r.nota);
  }
  return [...map.values()].filter(g=>legivel(g.aluno).toLocaleLowerCase("pt-BR").includes(busca.trim().toLocaleLowerCase("pt-BR"))).sort((a,b)=>a.aluno.localeCompare(b.aluno,"pt-BR")||ordemPeriodo(a.periodo)-ordemPeriodo(b.periodo));
 },[registros,busca]);
 const paginas=Math.max(1,Math.ceil(grupos.length/20));
 const atual=Math.min(pagina,paginas);
 const visiveis=grupos.slice((atual-1)*20,atual*20);
 if(!registros.length)return <p className="muted">Nenhuma avaliação concluída para gerar o boletim.</p>;
 return <section aria-label="Boletim consolidado por aluno" className="pp-consolidated">
  <div className="pp-report-intro"><h3>Boletim consolidado</h3><p className="muted small">Uma linha por matrícula e período. Disciplinas em colunas; média simples das disciplinas avaliadas, sem regra automática de aprovação.</p></div>
  <label className="pp-consolidated-search">Localizar aluno<input type="search" value={busca} placeholder="Digite o nome" onChange={e=>{setBusca(e.target.value);setPagina(1)}}/></label>
  <div className="relatorio-tabela-wrap"><table className="relatorio-tabela pp-consolidated-table">
   <thead><tr><th scope="col">Aluno</th><th scope="col">Turma</th><th scope="col">Período</th>{disciplinas.map(d=><th scope="col" key={d.id}>{d.nome}</th>)}<th scope="col">Média</th></tr></thead>
   <tbody>{visiveis.map(g=>{
    const valores=disciplinas.map(d=>g.notas.get(d.id)??null);
    const m=media(valores);
    return <tr key={g.matriculaId+"|"+g.periodo}><th scope="row">{legivel(g.aluno)}</th><td>{g.turma}</td><td>{g.periodo}</td>
     {disciplinas.map((d,i)=><td key={d.id} className="pp-consolidated-value">{formatar(valores[i])}</td>)}
     <td className="pp-consolidated-value"><strong>{formatar(m)}</strong></td>
    </tr>;
   })}</tbody>
  </table></div>
  <div className="pp-pagination"><span>{grupos.length} linha(s)</span><button type="button" className="secondary" disabled={atual===1} onClick={()=>setPagina(x=>x-1)}>Anterior</button><span>{atual} / {paginas}</span><button type="button" className="secondary" disabled={atual>=paginas} onClick={()=>setPagina(x=>x+1)}>Próxima</button></div>
 </section>;
}

export function GraficoEvolucao({registros}:{registros:RegistroPedagogico[]}){
 const [tipo,setTipo]=useState<"aluno"|"turma">("aluno");
 const [matriculaId,setMatriculaId]=useState("");
 const [disciplinaId,setDisciplinaId]=useState("");
 const [turmaId,setTurmaId]=useState("");
 const turmas=useMemo(()=>Array.from(new Map(registros.map(r=>[r.turmaId,{id:r.turmaId,nome:r.turma+" · "+r.anoLetivo}])).values()),[registros]);
 const turmaValida=turmas.some(t=>t.id===turmaId)?turmaId:turmas[0]?.id??"";
 const candidatos=registros.filter(r=>r.turmaId===turmaValida);
 const alunos=useMemo(()=>Array.from(new Map(candidatos.map(r=>[r.matriculaId,{id:r.matriculaId,nome:r.aluno}])).values()).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")),[candidatos]);
 const alunoValido=alunos.some(a=>a.id===matriculaId)?matriculaId:alunos[0]?.id??"";
 const relevantes=candidatos.filter(r=>tipo==="turma"||r.matriculaId===alunoValido);
 const disciplinas=Array.from(new Map(relevantes.map(r=>[r.disciplinaId,{id:r.disciplinaId,nome:r.disciplina}])).values()).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
 const disciplinaValida=disciplinas.some(d=>d.id===disciplinaId)?disciplinaId:disciplinas[0]?.id??"";
 const dados=relevantes.filter(r=>r.disciplinaId===disciplinaValida);
 const periodos=[...new Set(dados.map(r=>r.periodo))].sort((a,b)=>ordemPeriodo(a)-ordemPeriodo(b)||a.localeCompare(b,"pt-BR"));
 const pontos=periodos.map(periodo=>({periodo,valor:media(dados.filter(r=>r.periodo===periodo).map(r=>r.nota))}));
 const validos=pontos.filter(p=>p.valor!==null);
 const chartW=680,chartH=270,x0=50,x1=655,y0=24,y1=220;
 const px=(i:number)=>x0+(pontos.length>1?i/(pontos.length-1):.5)*(x1-x0);
 const py=(v:number)=>y1-(v/10)*(y1-y0);
 const linha=pontos.map((p,i)=>p.valor===null?null:{i,v:p.valor}).filter((p):p is {i:number;v:number}=>p!==null);
 const trechos:string[][]=[];let atual:string[]=[];
 pontos.forEach((p,i)=>{if(p.valor===null){if(atual.length)trechos.push(atual);atual=[];}else atual.push(px(i)+","+py(p.valor));});
 if(atual.length)trechos.push(atual);
 return <section className="pp-evolution-graph" aria-label="Gráfico de evolução por período">
  <div className="pp-report-intro"><h3>Evolução das avaliações</h3><p className="muted small">Compare a mesma disciplina por período. Na visão da turma, cada ponto representa a média simples das avaliações concluídas naquele período.</p></div>
  <div className="pp-evolution-controls">
   <label>Visualização<select value={tipo} onChange={e=>setTipo(e.target.value as "aluno"|"turma")}><option value="aluno">Aluno</option><option value="turma">Turma (média)</option></select></label>
   <label>Turma<select value={turmaValida} onChange={e=>setTurmaId(e.target.value)}>{turmas.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}</select></label>
   {tipo==="aluno"&&<label>Aluno<select value={alunoValido} onChange={e=>setMatriculaId(e.target.value)}>{alunos.map(a=><option key={a.id} value={a.id}>{legivel(a.nome)}</option>)}</select></label>}
   <label>Disciplina<select value={disciplinaValida} onChange={e=>setDisciplinaId(e.target.value)}>{disciplinas.map(d=><option key={d.id} value={d.id}>{d.nome}</option>)}</select></label>
  </div>
  {validos.length<2?<p className="pp-evolution-empty" role="status">O gráfico de evolução fica disponível após pelo menos dois períodos com avaliação concluída para a seleção atual.</p>:
  <>
  <div className="pp-chart-scroll"><svg viewBox={"0 0 "+chartW+" "+chartH} role="img" aria-label={tipo==="aluno"?"Linha de indicadores do aluno por período":"Linha da média da turma por período"} className="pp-chart-svg">
   {[0,2.5,5,7.5,10].map(v=><g key={v}><line x1={x0} x2={x1} y1={py(v)} y2={py(v)} stroke="#ded9ea" strokeDasharray="4 4"/><text x="39" y={py(v)+4} textAnchor="end" fontSize="12" fill="#50445d">{formatar(v)}</text></g>)}
   {trechos.map((t,i)=>t.length>1?<polyline key={i} points={t.join(" ")} fill="none" stroke="#5734dc" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>:null)}
   {linha.map(p=><g key={p.i}><circle cx={px(p.i)} cy={py(p.v)} r="6" fill="#5734dc" stroke="#fff" strokeWidth="2"/><text x={px(p.i)} y={py(p.v)-13} textAnchor="middle" fontSize="12" fontWeight="700" fill="#321f70">{formatar(p.v)}</text></g>)}
   {pontos.map((p,i)=><text key={i} x={px(i)} y={248} textAnchor="middle" fontSize="11" fill="#50445d">{p.periodo.length>17?p.periodo.slice(0,16)+"…":p.periodo}</text>)}
  </svg></div>
  <table className="pp-chart-data"><caption>Dados utilizados no gráfico</caption><thead><tr><th scope="col">Período</th><th scope="col">Indicador</th></tr></thead><tbody>{pontos.map(p=><tr key={p.periodo}><td>{p.periodo}</td><td>{formatar(p.valor)}</td></tr>)}</tbody></table>
  </>}
 </section>;
}
