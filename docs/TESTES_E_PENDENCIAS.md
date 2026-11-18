# Portal do Professor — Matriz de testes e pendências

**Revisão:** 18/11/2026 · **Fontes:** relatos de homologação nesta conversa, código e SQL do repositório.

## 1. Critérios de status

- **Aprovado manualmente:** usuário executou o fluxo e comunicou resultado.
- **Inspeção visual:** captura de tela coerente, mas não substitui teste de exportação.
- **Implementado sem homologação:** código presente; não houve relato de conclusão do teste.
- **Pendente:** requer implementação ou evidência de teste.

## 2. Resultados já relatados

| ID | Fluxo | Resultado | Evidência declarada |
|---|---|---|---|
| AV-01 | Salvar rascunho | Aprovado manualmente | Conceitos e indicador 7,6, status Rascunho |
| AV-02 | Persistir ao recarregar | Aprovado manualmente | Cinco conceitos conservados |
| AV-03 | Atualizar rascunho | Aprovado manualmente | Ortografia Regular → Bom, indicador 8,0; uma RPC por salvamento |
| AV-04 | Concluir e bloquear | Aprovado manualmente | Campos/botões bloqueados após recarregar |
| AV-05 | Ficha ↔ grade | Aprovado manualmente | Mesma nota 8,0 |
| REV-01 | Solicitar reabertura | Aprovado manualmente | Justificativa obrigatória |
| REV-02 | Reabrir e registrar | Aprovado manualmente | Status Rascunho e histórico em andamento |
| REV-03 | Alterar e reconcluir | Aprovado manualmente | Arte, Criação coletiva: Ruim → Bom; 5,0 → 6,7 |
| REV-04 | Histórico anterior/posterior | Aprovado manualmente | Motivo, carimbos de tempo, responsável e diff |
| AUTH-01 | Conta B não vê dados da conta A na interface | Aprovado manualmente | Conta separada apresentou ambiente vazio |
| REL-01 | Relatório individual em tela | Inspeção visual | Aluna de teste: Arte 6,7; Português 8,0; média 7,4; pesos e observações |
| REL-02 | CSV e PDF | Implementado sem homologação | Botões presentes; arquivos ainda não verificados |
| REL-03 | Relatório por turma | Implementado sem homologação | Código presente |
| REL-04 | Evolução por períodos | Implementado sem homologação | Código presente |

## 3. Testes necessários antes de liberar dados reais

### 3.1 Segurança e isolamento

- [ ] Com dois tokens reais de professores A e B, tentar **SELECT** em `escolas`, `turmas`, `alunos`, `matriculas`, `disciplinas`, `competencias`, `turma_competencias`, `avaliacoes`, `avaliacao_itens`, `avaliacao_revisoes` e view `motor_v06_indicadores`.
- [ ] Na conta B, tentar **INSERT/UPDATE/DELETE** vinculando identificadores pertencentes à conta A; banco deve negar, sem modificar os dados de A.
- [ ] Tentar chamar `motor_v06_salvar_avaliacao` com `matricula_id` ou `disciplina_id` de outra conta; deve negar.
- [ ] Tentar chamar `motor_v061_reabrir_avaliacao` com UUID de avaliação de outra conta; deve negar.
- [ ] Tentar UPDATE/DELETE direto em avaliação concluída e itens concluídos; deve negar.
- [ ] Testar chamada RPC sem login e usuário sem perfil válido; deve negar.
- [ ] Confirmar acesso restrito e impossibilidade de escrita direta em `avaliacao_revisoes`.
- [ ] Revisar `SECURITY DEFINER`, privilégios EXECUTE, `search_path`, funções e grants com Supabase Security Advisor.

**Observação:** fazer os testes com duas contas fictícias e ambiente controlado. Não utilizar dados de crianças reais.

### 3.2 Motor e integridade

- [ ] Enviar a mesma avaliação simultaneamente em duas abas: não deve surgir duplicidade.
- [ ] Enviar item duplicado, conceito inválido, competência de outra disciplina ou conjunto incompleto: erro e transação revertida.
- [ ] Concluir com todos conceitos `nao_avaliado` ou pesos 0: deve negar.
- [ ] Mudar peso/descrição após concluir; histórico deve preservar peso/nome originais.
- [ ] Reabrir mais de uma vez; cada revisão precisa ter `snapshot_antes` e `snapshot_depois`, autor e timestamps.
- [ ] Testar concorrência de reabertura e conclusão.
- [ ] Verificar comportamento em matrícula inativa e disciplina removida.

### 3.3 Relatórios e exportações

- [ ] Filtros escola/turma/disciplina/aluno/período selecionam somente avaliações concluídas.
- [ ] Relatório individual reproduz conceito e `peso_aplicado` de cada item.
- [ ] Relatório de turma mostra as mesmas notas da ficha individual.
- [ ] Evolução ordena mensal, semanal, bimestral e trimestral corretamente e compara períodos da mesma turma e disciplina.
- [ ] Reabertura faz avaliação sair dos relatórios até reconclusão; sem mostrar indevidamente registros de outra conta.
- [ ] CSV no Excel: UTF-8 com acentos, números decimais pt-BR, separador `;`, múltiplos alunos e caracteres especiais.
- [ ] PDF via Chrome/Edge: A4, tabela longa, quebra de página, cabeçalho/rodapé, sem menus e botões.
- [ ] Testar nenhuma avaliação, muitos alunos, notas vazias e diversas escolas/anos.
- [ ] Conferir se **alunos homônimos** da mesma turma são contabilizados individualmente — observação técnica conhecida.

### 3.4 Usabilidade e dados

- [ ] Criar, editar e excluir escola sem vínculo, com confirmação.
- [ ] Duplicar turma com e sem competências e tratar cópia parcial.
- [ ] Importar nomes individuais, lista e planilha Excel; validar acentos, repetição e limite.
- [ ] Garantir que alunos de uma turma não apareçam em outra por engano.
- [ ] Confirmar comportamento no celular, teclado e leitor de tela.
- [ ] Planejar backup, recuperação e retenção de dados conforme a finalidade pedagógica.

## 4. Backlog priorizado

| Prioridade | Item | Motivo |
|---|---|---|
| P0 | Testar RLS e RPC com contas diferentes via API | Isolamento é requisito do produto |
| P0 | Auditar privilegiamento da função de reabertura | `SECURITY DEFINER` exige atenção |
| P1 | Homologar CSV/PDF e relatórios Turma/Evolução | V0.7 está implementada mas não integralmente testada |
| P1 | Corrigir contagem por matrícula, não por nome | Evita confundir homônimos |
| P1 | Revisar ordenação de períodos/ano | Evolução consistente |
| P1 | Validar ausência de erros em grandes bases e paginação | Limite padrão de linhas de consultas |
| P2 | Gerar PDF paginado e arquivo XLSX nativo | Melhoria de saída documental |
| P2 | Criar dashboard de métricas e automação de testes | Evolução de produto e regressão |
| P2 | Tornar duplicação/importações multi-etapa transacionais | Evitar sucesso parcial |

## 5. Política de escopo V1

- **Sem compartilhamento entre professores.**
- Escolas, turmas, matrículas, alunos, avaliações e históricos pertencem a um professor.
- A biblioteca global de competências é comum; cópias, pesos e avaliações são individuais.
- Não inferir desempenho pedagógico em relatório a partir de uma única nota: os indicadores servem como instrumento de apoio ao professor, não classificação automática de alunos.

## 6. Manutenção desta documentação

Ao criar ou alterar uma rota, atualizar **MANUAL_FUNCIONAL.md**. Ao mudar tabelas, grants, políticas, funções ou RPC, atualizar **ARQUITETURA_E_FUNCOES.md**. Após cada homologação, registrar evidência e data nesta matriz. Atualizar o README com links a estes três documentos.
