# Portal do Professor

Sistema web individual de acompanhamento pedagógico de professores do **Ensino Fundamental I (1º ao 5º ano)**.

## Documentação oficial do projeto

| Documento | Conteúdo |
|---|---|
| [Manual funcional e páginas](docs/MANUAL_FUNCIONAL.md) | Todas as páginas, campos, operações, regras de uso e fluxo completo |
| [Arquitetura, funções e dados](docs/ARQUITETURA_E_FUNCOES.md) | Stack, módulos TSX, RPCs, triggers, tabelas, view e segurança |
| [Testes e pendências](docs/TESTES_E_PENDENCIAS.md) | Homologações relatadas, testes pendentes e backlog priorizado |

Revisão da documentação: **18/11/2026**.

## Funcionalidades disponíveis

- Cadastro/login com e-mail e senha ou Google, recuperação de senha.
- Escolas e turmas individuais, com duplicação de turma para outro ano letivo.
- Cadastro de alunos individual, em lote ou por planilha Excel; dados pessoais limitados ao nome.
- Disciplinas, biblioteca compartilhada de modelos de competências e configuração privada de pesos por turma.
- Avaliação individual e por turma, com rascunho, conclusão e indicador ponderado de 0,0 a 10,0.
- Reabertura de avaliações concluídas com motivo obrigatório e histórico de alterações.
- Relatórios por aluno, por turma e evolução; exportação CSV e impressão/salvamento em PDF pelo navegador.

## Política V1: sem compartilhamento

**Cada professor acessa apenas seus cadastros e avaliações.** Não há colaboração entre contas, mesmo para professores da mesma escola. A biblioteca geral de modelos de competências é compartilhada, mas as competências importadas e suas configurações são privadas.

O isolamento usa Supabase Auth e políticas RLS. A interface já foi testada com duas contas diferentes; testes adversariais de API continuam pendentes, conforme [matriz de testes](docs/TESTES_E_PENDENCIAS.md).

## Regras de avaliação

- Ruim: 2,5.
- Regular: 5,0.
- Bom: 7,5.
- Ótimo: 10,0.
- Não avaliado: fora da média.

Indicador = soma de (nota × peso) / soma dos pesos das competências efetivamente avaliadas. Pesos e nomes históricos ficam registrados nos itens de avaliação. Os relatórios utilizam apenas avaliações concluídas.

## Tecnologia e execução

Next.js 15, React 19, TypeScript e Supabase (Auth, PostgreSQL e RLS). Hospedagem via Vercel.

Crie `.env.local` a partir de `.env.example` e configure:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
```

```bash
npm install
npm run dev
npm run build
```

**Nunca** publicar chave service-role ou segredos em variáveis expostas ao navegador.

## Migrações do motor

Os arquivos `sql/migracao_motor_v06.sql` e `sql/migracao_motor_v061_revisoes.sql` são executados no projeto Supabase do Portal do Professor e **não são aplicados pela Vercel**. Confirme que o banco recebeu as migrações antes de usar a interface.

## Status

Motor pedagógico V0.6/V0.6.1: homologação funcional manual relatada. Relatório individual V0.7: inspeção visual realizada. Exportações, relatório por turma/evolução e testes de isolamento direto via API ainda carecem de homologação formal. Consultar os documentos acima para detalhes.
