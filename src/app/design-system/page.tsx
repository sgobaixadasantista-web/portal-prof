"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import ProfessorShell from "@/components/ProfessorShell";
import {
 DSAlert,DSBadge,DSButton,DSCard,DSConceptSelect,DSSelect,DSStatCard,
 DSTabs,DSTextArea,DSTextField,DS_CONCEPTS,type DSConcept
} from "@/components/ui/DesignSystem";
import "../../styles/design-tokens.css";
import "./catalog.css";

const PALETTE=[
 {name:"Índigo principal",hex:"#5146A5",token:"--pp-color-primary"},
 {name:"Índigo escuro",hex:"#3B337C",token:"--pp-color-primary-active"},
 {name:"Lavanda",hex:"#987AC6",token:"--pp-color-accent"},
 {name:"Pêssego",hex:"#E6A06A",token:"--pp-color-highlight"},
 {name:"Fundo",hex:"#F8F7FC",token:"--pp-color-page"},
 {name:"Superfície",hex:"#FFFFFF",token:"--pp-color-surface"},
 {name:"Texto",hex:"#242338",token:"--pp-color-text"},
 {name:"Borda",hex:"#E3E0ED",token:"--pp-color-border"}
] as const;
const TOPICS=[
 ["cores","Cores & tokens"],["tipografia","Tipografia"],["botoes","Botões"],
 ["formularios","Formulários"],["estados","Estados & feedback"],["cards","Cards & indicadores"],
 ["tabelas","Tabelas & abas"],["avaliacoes","Simulador pedagógico"],["auditoria","Histórico & diretrizes"]
] as const;
const CRITERIOS=[
 {id:"leitura",nome:"Leitura e interpretação",peso:2},
 {id:"escrita",nome:"Produção escrita",peso:1},
 {id:"participacao",nome:"Participação nas atividades",peso:1},
] as const;
type SectionMode="individual"|"turma"|"evolucao";

function Catalog(){
 const [modo,setModo]=useState<SectionMode>("individual");
 const [nome,setNome]=useState("Ana Beatriz Moura");
 const [turma,setTurma]=useState("3º Ano A");
 const [observacao,setObservacao]=useState("Demonstração do estilo visual de observações.");
 const [email,setEmail]=useState("");
 const [mostrarErro,setMostrarErro]=useState(false);
 const [feedback,setFeedback]=useState<"idle"|"ok">("idle");
 const [notas,setNotas]=useState<Record<string,DSConcept>>({
  leitura:"bom",escrita:"otimo",participacao:"regular"
 });
 const indicador=useMemo(()=>{
  let soma=0,pesos=0;
  for(const c of CRITERIOS){
   const nota=DS_CONCEPTS.find(x=>x.value===(notas[c.id]??"nao_avaliado"))?.nota??null;
   if(nota!==null){soma+=nota*c.peso;pesos+=c.peso;}
  }
  return pesos?soma/pesos:null;
 },[notas]);
 const mostrarNota=(v:number|null)=>v===null?"—":v.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1});
 const exemplo=(label:string)=>{setFeedback("ok");setTimeout(()=>setFeedback("idle"),2500);};
 return <div className="ds-catalog">
  <div className="ds-container">
   <div className="ds-top">
    <div>
     <div className="ds-eyebrow">Portal do Professor / Laboratório visual / v1.0</div>
     <h1>Design System <span style={{color:"var(--pp-color-primary)"}}>Criativa Contemporânea</span></h1>
     <p className="ds-muted">Paleta D · Componentes reutilizáveis · Tema claro · Demonstração isolada</p>
    </div>
    <Link href="/dashboard" style={{fontSize:13,fontWeight:600,alignSelf:"center"}}>Voltar ao dashboard</Link>
   </div>
   <div className="ds-note" style={{marginBottom:20}}>
    Este catálogo é um ambiente demonstrativo. Alterar conceitos, formulários ou botões aqui <strong>não grava dados</strong> nem altera as avaliações do professor.
   </div>
   <div className="ds-layout">
    <aside className="ds-index" aria-label="Seções do catálogo"><strong>Biblioteca visual</strong>
     {TOPICS.map(([id,label])=><a key={id} href={"#"+id}>{label}</a>)}
    </aside>
    <div className="ds-main">
     <DSCard id="cores">
      <div className="ds-section-head"><h2>01. Paleta & tokens</h2><p>Valores primitivos e significados semânticos</p></div>
      <div className="ds-swatch-grid">
       {PALETTE.map(c=><div className="ds-swatch" key={c.token}><div className="ds-swatch__color" style={{background:c.hex}}/><b>{c.name}</b><code>{c.hex}</code><div className="ds-muted" style={{fontSize:10,overflowWrap:"anywhere"}}>{c.token}</div></div>)}
      </div>
      <p className="ds-muted" style={{marginTop:15}}>Lavanda e pêssego são destaques. Textos e botões essenciais usam cores com contraste apropriado.</p>
     </DSCard>
     <DSCard id="tipografia">
      <div className="ds-section-head"><h2>02. Tipografia</h2><p>Inter com fallback do sistema</p></div>
      <div className="ds-type-row"><span>Display / 30</span><strong style={{fontSize:30}}>Aprender é evoluir</strong></div>
      <div className="ds-type-row"><span>Título / 24</span><strong style={{fontSize:24}}>Acompanhamento pedagógico</strong></div>
      <div className="ds-type-row"><span>Seção / 20</span><strong style={{fontSize:20}}>Avaliações por período</strong></div>
      <div className="ds-type-row"><span>Corpo / 16</span><div style={{fontSize:16}}>Uma experiência clara para acompanhar o desenvolvimento dos alunos.</div></div>
      <div className="ds-type-row"><span>Legenda / 12</span><div style={{fontSize:12,color:"var(--pp-color-text-muted)"}}>Dados de demonstração · Ensino Fundamental I</div></div>
     </DSCard>
     <DSCard id="botoes">
      <div className="ds-section-head"><h2>03. Botões</h2><p>Variantes, tamanhos e estados</p></div>
      <div className="ds-demo-row">
       <DSButton onClick={()=>exemplo("principal")}>Ação principal</DSButton>
       <DSButton variant="secondary" onClick={()=>exemplo("secundária")}>Secundária</DSButton>
       <DSButton variant="outline" onClick={()=>exemplo("contorno")}>Contorno</DSButton>
       <DSButton variant="ghost" onClick={()=>exemplo("texto")}>Discreta</DSButton>
       <DSButton variant="danger" onClick={()=>exemplo("destrutiva")}>Excluir</DSButton>
      </div>
      <div className="ds-demo-row" style={{marginTop:18}}>
       <DSButton size="sm" onClick={()=>exemplo("pequeno")}>Pequeno</DSButton>
       <DSButton size="lg" onClick={()=>exemplo("grande")}>Grande</DSButton>
       <DSButton loading>Processando…</DSButton>
       <DSButton disabled>Desabilitado</DSButton>
      </div>
      {feedback==="ok"?<p role="status" style={{color:"var(--pp-color-success)",fontSize:13,marginTop:12}}>Interação demonstrativa acionada. Nenhum dado foi enviado.</p>:null}
     </DSCard>
     <DSCard id="formularios">
      <div className="ds-section-head"><h2>04. Formulários</h2><p>Rótulos, auxílio, erro e campo desabilitado</p></div>
      <div className="ds-grid">
       <DSTextField id="ds-nome" label="Nome do aluno" required value={nome} onChange={e=>setNome(e.target.value)} hint="Informe o nome utilizado na lista da turma."/>
       <DSSelect id="ds-turma" label="Turma" required value={turma} onChange={e=>setTurma(e.target.value)}>
        <option>3º Ano A</option><option>4º Ano B</option><option>5º Ano C</option>
       </DSSelect>
       <DSTextField id="ds-email" label="E-mail de contato (exemplo)" type="email" value={email} onChange={e=>{setEmail(e.target.value);setMostrarErro(false);}} error={mostrarErro?"Insira um e-mail válido para esta demonstração.":undefined} placeholder="professor@exemplo.com"/>
       <DSTextField id="ds-desabilitado" label="Avaliação concluída" value="Edição bloqueada" disabled readOnly/>
      </div>
      <div className="ds-grid" style={{marginTop:16}}>
       <DSTextArea id="ds-obs" label="Observações pedagógicas" value={observacao} onChange={e=>setObservacao(e.target.value)} hint="Texto fictício, somente nesta página."/>
       <div className="ds-stack">
        <p className="ds-muted">Validação visual do campo de e-mail</p>
        <DSButton variant="outline" onClick={()=>setMostrarErro(true)}>Demonstrar erro</DSButton>
        <DSButton variant="ghost" onClick={()=>{setMostrarErro(false);setEmail("");}}>Limpar exemplo</DSButton>
       </div>
      </div>
     </DSCard>
     <DSCard id="estados">
      <div className="ds-section-head"><h2>05. Estados & feedback</h2><p>Badges e avisos sem dependência exclusiva da cor</p></div>
      <div className="ds-demo-row" style={{marginBottom:18}}>
       <DSBadge>Não iniciada</DSBadge><DSBadge tone="warning">Rascunho</DSBadge>
       <DSBadge tone="success">Concluída</DSBadge><DSBadge tone="info">Em revisão</DSBadge>
       <DSBadge tone="danger">Erro no salvamento</DSBadge>
      </div>
      <div className="ds-grid">
       <DSAlert tone="success" title="Avaliação salva">O registro demonstrativo foi concluído.</DSAlert>
       <DSAlert tone="info" title="Orientação">Use os filtros para localizar sua turma.</DSAlert>
       <DSAlert tone="warning" title="Rascunho pendente">Existem conceitos ainda não avaliados.</DSAlert>
       <DSAlert tone="danger" title="Não foi possível salvar">Confira as informações e tente novamente.</DSAlert>
      </div>
     </DSCard>
     <DSCard id="cards">
      <div className="ds-section-head"><h2>06. Cards & indicadores</h2><p>Dados fictícios apenas para demonstração</p></div>
      <div className="ds-grid ds-grid--3">
       <DSStatCard label="Alunos" value="19" detail="Turma de demonstração" icon="◌"/>
       <DSStatCard label="Avaliações" value="12" detail="9 concluídas" icon="▤"/>
       <DSStatCard label="Indicador" value="7,4" detail="Média ilustrativa" icon="↗"/>
      </div>
     </DSCard>
     <DSCard id="tabelas">
      <div className="ds-section-head"><h2>07. Tabelas & abas</h2><p>Filtros visuais e visualização tabular</p></div>
      <DSTabs ariaLabel="Visualização de relatórios" value={modo} onChange={setModo} options={[{value:"individual",label:"Individual"},{value:"turma",label:"Turma"},{value:"evolucao",label:"Evolução"}]}/>
      <div className="ds-table-scroll" style={{marginTop:15}}>
       <table className="ds-table">
        <thead><tr><th>Aluno</th><th>Disciplina</th><th>Período</th><th className="ds-right">Indicador</th><th>Status</th></tr></thead>
        <tbody>
         {(modo==="evolucao"?[
          ["Ana Beatriz Moura","Arte","1º Bimestre","6,7"],["Ana Beatriz Moura","Arte","2º Bimestre","7,5"]
         ]:modo==="turma"?[
          ["Ana Beatriz Moura","Arte","1º Bimestre","6,7"],["João Pedro Silva","Arte","1º Bimestre","7,5"]
         ]:[
          ["Ana Beatriz Moura","Arte","1º Bimestre","6,7"],["Ana Beatriz Moura","Português","1º Bimestre","8,0"]
         ]).map((r,i)=><tr key={modo+i}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td className="ds-right"><strong>{r[3]}</strong></td><td><DSBadge tone="success">Concluída</DSBadge></td></tr>)}
        </tbody>
       </table>
      </div>
     </DSCard>
     <DSCard id="avaliacoes">
      <div className="ds-section-head"><h2>08. Simulador de avaliação</h2><p>Conceitos reais, resultados apenas locais</p></div>
      <div className="ds-eval">
       {CRITERIOS.map(c=><div key={c.id} className="ds-eval-row">
        <div><strong>{c.nome}</strong><small>Peso: {c.peso}</small></div>
        <DSConceptSelect id={"ds-c-"+c.id} label="Conceito" value={notas[c.id]??"nao_avaliado"} onChange={v=>setNotas(old=>({...old,[c.id]:v}))}/>
       </div>)}
       <div className="ds-eval-result">
        <div><div className="ds-eyebrow">Indicador ponderado</div><span className="ds-muted">Prévia calculada no navegador</span></div>
        <strong>{mostrarNota(indicador)} / 10,0</strong>
       </div>
       <div className="ds-demo-row">
        <DSButton onClick={()=>setNotas({leitura:"bom",escrita:"otimo",participacao:"regular"})}>Restaurar exemplo</DSButton>
        <DSButton variant="outline" onClick={()=>setNotas({leitura:"nao_avaliado",escrita:"nao_avaliado",participacao:"nao_avaliado"})}>Limpar conceitos</DSButton>
       </div>
      </div>
     </DSCard>
     <DSCard id="auditoria">
      <div className="ds-section-head"><h2>09. Histórico & diretrizes</h2><p>Visual para revisão auditada</p></div>
      <div className="ds-history">
       <div className="ds-history__item"><strong>Reabertura solicitada</strong><p>Motivo informado · responsável identificado · versão anterior preservada</p></div>
       <div className="ds-history__item"><strong>Conceito revisado</strong><p>Criação coletiva: Ruim → Bom</p></div>
       <div className="ds-history__item"><strong>Avaliação concluída</strong><p>Versão corrigida registrada · campos novamente bloqueados</p></div>
      </div>
      <div className="ds-note" style={{marginTop:18}}>A aplicação visual preservará Supabase Auth, RLS, todas as RPCs de avaliação e reabertura, pesos históricos, importações e exportações existentes. O Design System não implementa compartilhamento entre professores.</div>
      <p className="ds-muted" style={{marginTop:13}}>Próxima etapa: aprovar esta biblioteca e migrar as páginas em fases, começando por login e navegação.</p>
     </DSCard>
    </div>
   </div>
  </div>
 </div>;
}
export default function DesignSystemPage(){return <ProfessorShell>{()=> <Catalog/>}</ProfessorShell>;}
