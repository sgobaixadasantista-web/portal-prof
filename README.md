# Portal do Professor

Sistema web de acompanhamento pedagógico para professores do Ensino Fundamental I (1º ao 5º ano).

## Recursos planejados

- Autenticação com Google ou e-mail/senha usando Supabase Auth.
- Cadastro de várias escolas, turmas e alunos (somente nome do aluno).
- Biblioteca de competências e competências personalizadas.
- Avaliações individuais e por turma, com pesos configuráveis.
- Indicador de 0,0 a 10,0: Ruim 2,5, Regular 5,0, Bom 7,5, Ótimo 10,0; não avaliado fora da média.
- Relatórios individual, turma e comparativo (PDF e Excel).

## Ambiente

Next.js + TypeScript + Supabase. Copie `.env.example` para `.env.local` e configure a URL e a chave publicável do seu projeto Supabase. Nunca coloque a chave secreta/service-role no frontend ou no Git.

```bash
npm install
npm run dev
```

## Segurança

Cada professor acessa apenas seus registros por meio das políticas RLS no Supabase. Valide o isolamento entre duas contas antes de utilizar dados reais de alunos.
