# Portal do Professor — Registro de entrega V0.8 (18/11/2026)

## Alterações implementadas

1. **Boletim consolidado** em `/relatorios`: nova aba Boletim, uma linha para cada matrícula/período, disciplinas em colunas, média simples de indicadores avaliados. Mantém filtros e exportação CSV específica com a mesma matriz.
2. **Evolução pedagógica**: gráfico vetorial acessível (SVG), com dados tabulares equivalentes. Seleção de turma, aluno ou média de turma, disciplina e períodos. Gráfico aparece a partir de dois períodos com indicadores válidos.
3. **Navegação persistente**: `src/components/PortalFrame.tsx` montado no layout raiz, com controle de sessão Supabase e navegação. `ProfessorShell` agora consome contexto e não recria sidebar/topbar em cada rota. Telas de login/recuperação continuam públicas, sem menu lateral.
4. **Cadastro de alunos**: alerta sobre nomes semelhantes na turma ou no lote, sem impedir o cadastramento (evita bloquear homônimos legítimos). Verificação adicional na edição.
5. **Dashboard**: destaque de avaliações em rascunho com atalho para continuar.
6. **Contraste e impressão**: estilos específicos para tabelas, filtros, gráficos e alertas.

## Regras e limites

- Os indicadores vêm de `motor_v06_indicadores` e somente de avaliações concluídas. Nenhuma nota foi alterada.
- A média no boletim é a média simples das disciplinas com nota válida; **não determina aprovação/reprovação** e não altera o cálculo ponderado original de cada avaliação.
- O gráfico da turma utiliza média simples das avaliações concluídas por disciplina e período, **não** substitui uma análise pedagógica.
- Para dois estudantes com o mesmo nome, o boletim usa `matricula_id` como chave, mantendo-os independentes.
- A proteção por `professor_id` permanece nas consultas e deve ser reforçada por políticas RLS reais; o frontend não substitui autorização no banco.
- A consulta da conta Supabase conectada não encontrou o projeto Portal do Professor (`ezvcnqsgwxepazlynsa`), portanto **não foi possível executar testes adversariais diretos da RLS nem o Security Advisor** nesta entrega.
- A versão ainda depende de homologação visual e funcional no navegador, inclusive upload de alunos, CSV, impressões, séries com muitos períodos e duas contas.

## Validação manual mínima

- [ ] Login e navegação Dashboard → Turmas → Relatórios → Avaliações sem desmontar menu/topbar.
- [ ] Logout seguido de tentativa de visitar rota interna: redirecionamento ao login.
- [ ] Login na segunda conta: não visualizar cadastros, boletins ou histórico da primeira.
- [ ] Boletim com 2 disciplinas e 1 período: conferir média contra as notas individuais.
- [ ] Boletim com 2 períodos: registros separados e exportação CSV com as mesmas colunas e médias.
- [ ] Evolução com apenas 1 período: mensagem explicativa.
- [ ] Evolução com 2 ou mais períodos: gráfico correto por aluno/turma, disciplina e série temporal.
- [ ] Duas matrículas homônimas: boletim mantém ambas.
- [ ] Cadastro com dois nomes semelhantes: alerta sem bloqueio, edição preservando o ID.
- [ ] Visualização mobile, zoom 200%, tabulação/teclado e PDF em A4.
- [ ] Testes de SELECT/UPDATE/RPC entre dois usuários autenticados diretamente na API Supabase.

## Orientação de homologação

Os dados de alunos são sensíveis. Realizar os testes com **contas e cadastros fictícios**, sem importar dados reais até completar a validação de segurança. Sem migrações SQL neste pacote.
