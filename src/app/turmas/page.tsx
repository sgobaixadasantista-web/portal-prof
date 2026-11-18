"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import ProfessorShell from "@/components/ProfessorShell";
import { getSupabase } from "@/lib/supabase";

type Escola = { id: string; nome: string };
type Turma = {
  id: string; professor_id: string; escola_id: string; nome: string;
  ano_letivo: number; ano_escolar: number;
  turno: "manha" | "tarde" | "integral" | "noite" | null;
  periodicidade: "semanal" | "mensal" | "bimestral" | "trimestral";
};
type Periodicidade = Turma["periodicidade"];
type Turno = NonNullable<Turma["turno"]>;
type FormData = {
  escola_id: string; nome: string; ano_letivo: string; ano_escolar: string;
  turno: Turno; periodicidade: Periodicidade;
};
const ANO_ATUAL = new Date().getFullYear();
const novoFormulario: FormData = {
  escola_id: "", nome: "", ano_letivo: String(ANO_ATUAL),
  ano_escolar: "1", turno: "manha", periodicidade: "bimestral",
};
const periodicidades: Periodicidade[] = ["semanal", "mensal", "bimestral", "trimestral"];
const turnos: Turno[] = ["manha", "tarde", "integral", "noite"];
const turnoLabel: Record<Turno, string> = {
  manha: "Manhã", tarde: "Tarde", integral: "Integral", noite: "Noite"
};
const periodoLabel: Record<Periodicidade, string> = {
  semanal: "Semanal", mensal: "Mensal", bimestral: "Bimestral", trimestral: "Trimestral"
};

function CadastroTurmas({ user }: { user: User }) {
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [form, setForm] = useState<FormData>(novoFormulario);
  const [editando, setEditando] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [filtroEscola, setFiltroEscola] = useState("");
  const [filtroAno, setFiltroAno] = useState("todos");

  const carregar = useCallback(async () => {
    setCarregando(true);
    const api = getSupabase();
    const [e, t] = await Promise.all([
      api.from("escolas").select("id,nome").eq("professor_id", user.id).order("nome"),
      api.from("turmas").select("id,professor_id,escola_id,nome,ano_letivo,ano_escolar,turno,periodicidade").eq("professor_id", user.id).order("ano_letivo", {ascending:false}).order("nome"),
    ]);
    if (e.error || t.error) setErro(e.error?.message ?? t.error?.message ?? "Erro ao carregar");
    else {
      setEscolas((e.data ?? []) as Escola[]);
      setTurmas((t.data ?? []) as Turma[]);
    }
    setCarregando(false);
  }, [user.id]);
  useEffect(() => { void carregar(); }, [carregar]);

  const visiveis = useMemo(() =>
    turmas.filter(t => (!filtroEscola || t.escola_id === filtroEscola) &&
      (filtroAno === "todos" || String(t.ano_letivo) === filtroAno)),
    [turmas, filtroEscola, filtroAno]
  );
  const anos = [...new Set(turmas.map(t => t.ano_letivo))].sort((a,b) => b-a);
  const nomeEscola = (id: string) => escolas.find(e => e.id === id)?.nome ?? "Escola não encontrada";
  const editarCampo = (campo: keyof FormData, valor: string) =>
    setForm(anterior => ({...anterior, [campo]: valor}));

  function limpar() {
    setForm({...novoFormulario, escola_id: escolas[0]?.id ?? ""});
    setEditando(null);
  }
  function editar(turma: Turma) {
    setEditando(turma.id);
    setForm({
      escola_id: turma.escola_id, nome: turma.nome,
      ano_letivo: String(turma.ano_letivo), ano_escolar: String(turma.ano_escolar),
      turno: turma.turno ?? "manha", periodicidade: turma.periodicidade,
    });
    setErro(""); setAviso("");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function salvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setErro(""); setAviso("");
    const nome = form.nome.trim();
    const ano = Number(form.ano_letivo);
    if (!escolas.some(e => e.id === form.escola_id)) {
      setErro("Selecione uma escola cadastrada."); return;
    }
    if (!nome || nome.length > 100 || !Number.isInteger(ano) || ano < 2000 || ano > 2100 ||
        ![1,2,3,4,5].includes(Number(form.ano_escolar))) {
      setErro("Verifique o nome, o ano letivo e o ano escolar."); return;
    }
    const duplicada = turmas.some(t => t.id !== editando && t.escola_id === form.escola_id &&
      t.ano_letivo === ano && t.ano_escolar === Number(form.ano_escolar) &&
      t.nome.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR"));
    if (duplicada) { setErro("Já existe uma turma com esse nome, escola, ano e série."); return; }
    setSalvando(true);
    const dados = {
      professor_id: user.id, escola_id: form.escola_id, nome,
      ano_letivo: ano, ano_escolar: Number(form.ano_escolar),
      turno: form.turno, periodicidade: form.periodicidade,
    };
    const api = getSupabase();
    const resultado = editando
      ? await api.from("turmas").update(dados).eq("id", editando).eq("professor_id", user.id).select("id").single()
      : await api.from("turmas").insert(dados).select("id").single();
    if (resultado.error) setErro(resultado.error.message);
    else { limpar(); await carregar(); setAviso(editando ? "Turma atualizada." : "Turma cadastrada."); }
    setSalvando(false);
  }

  async function duplicar(origem: Turma) {
    const entrada = window.prompt("Ano letivo da nova turma:", String(origem.ano_letivo + 1));
    if (entrada === null) return;
    const ano = Number(entrada);
    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100 || ano === origem.ano_letivo) {
      setErro("Informe outro ano letivo válido (2000 a 2100)."); return;
    }
    if (turmas.some(t => t.escola_id === origem.escola_id && t.nome === origem.nome &&
        t.ano_letivo === ano && t.ano_escolar === origem.ano_escolar)) {
      setErro("Essa turma já existe no ano selecionado."); return;
    }
    setSalvando(true); setErro(""); setAviso("");
    const api = getSupabase();
    const {data: nova, error: falha} = await api.from("turmas").insert({
      professor_id:user.id, escola_id:origem.escola_id, nome:origem.nome,
      ano_letivo:ano, ano_escolar:origem.ano_escolar,
      turno:origem.turno, periodicidade:origem.periodicidade
    }).select("id").single();
    if (falha || !nova) {setErro(falha?.message ?? "Não foi possível duplicar.");setSalvando(false);return;}
    const {data: competencias, error: erroLeitura} = await api.from("turma_competencias")
      .select("competencia_id,peso,ativa").eq("professor_id",user.id).eq("turma_id",origem.id);
    let alerta = "";
    if (erroLeitura) alerta = "A turma foi criada, mas não foi possível consultar as competências: "+erroLeitura.message;
    else if (competencias?.length) {
      const {error: erroCopia} = await api.from("turma_competencias").insert(
        competencias.map(c => ({
          professor_id:user.id,turma_id:nova.id,competencia_id:c.competencia_id,
          peso:c.peso,ativa:c.ativa
        }))
      );
      if (erroCopia) alerta = "A turma foi criada, mas não foi possível copiar as competências: "+erroCopia.message;
    }
    await carregar(); setSalvando(false);
    if (alerta) setErro(alerta);
    else setAviso("Turma duplicada para "+ano+". Alunos e avaliações não foram copiados.");
  }

  async function excluir(turma: Turma) {
    if (!window.confirm("Excluir a turma '"+turma.nome+"' de "+turma.ano_letivo+
      "? Faça isso somente se estiver vazia. Turmas com histórico de alunos ou avaliações devem ser preservadas.")) return;
    setSalvando(true);setErro("");setAviso("");
    const api = getSupabase();
    const {count, error: checagem} = await api.from("matriculas")
      .select("id",{count:"exact",head:true}).eq("professor_id",user.id).eq("turma_id",turma.id);
    if (checagem) setErro(checagem.message);
    else if (count && count > 0) setErro("Esta turma já possui matrículas. Para preservar o histórico, ela não pode ser excluída nesta tela.");
    else {
      const {error: falha} = await api.from("turmas").delete().eq("professor_id",user.id).eq("id",turma.id);
      if (falha) setErro("Não foi possível excluir a turma. Verifique os vínculos existentes. "+falha.message);
      else {await carregar();setAviso("Turma excluída.");}
    }
    setSalvando(false);
  }

  return <main className="wrap">
    <div className="row"><div><h1>Minhas turmas</h1><p className="muted">Organize suas turmas por escola e ano letivo.</p></div><span className="muted">{turmas.length} turma(s) cadastrada(s)</span></div>
    {erro && <p className="error" role="alert">{erro}</p>}
    {aviso && <p className="success" role="status">{aviso}</p>}
    {escolas.length === 0 && !carregando && <section className="card"><p>Você precisa cadastrar uma escola antes de criar turmas.</p><a href="/escolas">Cadastrar escola</a></section>}
    {escolas.length > 0 && <section className="card">
      <h2>{editando ? "Editar turma" : "Nova turma"}</h2>
      <form onSubmit={salvar}>
        <div className="form-grid">
          <label className="field">Escola
            <select value={form.escola_id} onChange={e=>editarCampo("escola_id",e.target.value)} required>
              <option value="">Selecione a escola</option>
              {escolas.map(e=><option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </label>
          <label className="field">Nome da turma
            <input value={form.nome} onChange={e=>editarCampo("nome",e.target.value)} maxLength={100} required placeholder="Ex.: 3º Ano A"/>
          </label>
          <label className="field">Ano letivo
            <input type="number" value={form.ano_letivo} onChange={e=>editarCampo("ano_letivo",e.target.value)} min="2000" max="2100" required/>
          </label>
          <label className="field">Ano escolar
            <select value={form.ano_escolar} onChange={e=>editarCampo("ano_escolar",e.target.value)}>
              {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}º ano</option>)}
            </select>
          </label>
          <label className="field">Período
            <select value={form.turno} onChange={e=>editarCampo("turno",e.target.value)}>
              {turnos.map(t=><option key={t} value={t}>{turnoLabel[t]}</option>)}
            </select>
          </label>
          <label className="field">Periodicidade da avaliação
            <select value={form.periodicidade} onChange={e=>editarCampo("periodicidade",e.target.value)}>
              {periodicidades.map(p=><option key={p} value={p}>{periodoLabel[p]}</option>)}
            </select>
          </label>
        </div>
        <div className="row" style={{justifyContent:"flex-start"}}>
          <button type="submit" disabled={salvando}>{salvando?"Salvando...":editando?"Salvar alterações":"Cadastrar turma"}</button>
          {editando && <button type="button" className="secondary" onClick={limpar}>Cancelar edição</button>}
        </div>
      </form>
    </section>}
    <section className="card top-space">
      <h2>Turmas cadastradas</h2>
      <div className="form-grid">
        <label className="field">Filtrar escola<select value={filtroEscola} onChange={e=>setFiltroEscola(e.target.value)}>
          <option value="">Todas as escolas</option>{escolas.map(e=><option key={e.id} value={e.id}>{e.nome}</option>)}
        </select></label>
        <label className="field">Filtrar ano letivo<select value={filtroAno} onChange={e=>setFiltroAno(e.target.value)}>
          <option value="todos">Todos os anos</option>{anos.map(a=><option key={a} value={a}>{a}</option>)}
        </select></label>
      </div>
      {carregando ? <p>Carregando...</p> : visiveis.length === 0 ? <p className="muted">Nenhuma turma encontrada.</p> :
        <div className="turma-lista">{visiveis.map(t=><article className="turma-item" key={t.id}>
          <div><strong>{t.nome}</strong><p className="muted small">{nomeEscola(t.escola_id)} · {t.ano_escolar}º ano · {t.ano_letivo}</p>
            <p className="small">{t.turno ? turnoLabel[t.turno] : "Período não informado"} · Avaliação {periodoLabel[t.periodicidade].toLowerCase()}</p></div>
          <div className="row" style={{justifyContent:"flex-end"}}>
            <button className="secondary" type="button" disabled={salvando} onClick={()=>editar(t)}>Editar</button>
            <button className="secondary" type="button" disabled={salvando} onClick={()=>void duplicar(t)}>Duplicar</button>
            <button className="secondary" type="button" disabled={salvando} onClick={()=>void excluir(t)}>Excluir</button>
          </div>
        </article>)}</div>}
    </section>
  </main>;
}
export default function TurmasPage() {
  return <ProfessorShell>{user => <CadastroTurmas user={user}/>}</ProfessorShell>;
}
