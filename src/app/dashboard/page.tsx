"use client";
import Link from "next/link";
import ProfessorShell from "@/components/ProfessorShell";

export default function Dashboard(){
 return <ProfessorShell>{user=><main className="wrap"><div className="row"><div><h1>Dashboard do Professor</h1><p className="muted">Bem-vindo(a), {String(user.user_metadata?.full_name||user.user_metadata?.name||user.email||"Professor")}.</p></div></div>
 <div className="grid">
 <section className="card"><h2>Escolas</h2><p>Cadastre e gerencie as instituições onde você leciona.</p><Link href="/escolas">Gerenciar escolas</Link></section>
 <section className="card"><h2>Turmas</h2><p>Cadastre turmas, defina os períodos de avaliação e duplique configurações por ano letivo.</p><Link href="/turmas">Gerenciar turmas</Link></section>
 <section className="card"><h2>Alunos</h2><p>Cadastre alunos pelo nome, em lote ou por planilha Excel.</p><Link href="/alunos">Gerenciar alunos</Link></section>
 <section className="card"><h2>Avaliações</h2><p>Avaliações por competências com indicadores de 0,0 a 10,0.</p></section>
 </div>
 <p className="muted small">Primeira versão de desenvolvimento. Os módulos ainda não implementados aparecem somente como planejamento.</p>
 </main>}</ProfessorShell>;
}
