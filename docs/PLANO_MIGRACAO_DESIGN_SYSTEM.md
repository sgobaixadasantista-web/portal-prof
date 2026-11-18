# Plano de aplicação gradual — Design System Paleta D

**Revisão:** 18/11/2026 · **Estado atual:** tokens ativados globalmente; login, cadastro, recuperação de senha e navegação principal migrados para a Paleta D. Demais páginas recebem tokens globais de cores e superfícies, mas seus componentes especializados ainda exigem migração e testes.
**Princípio:** o Design System altera apresentação; não altera autenticação, RLS, tabelas, dados, avaliações ou RPC.

## 1. Estratégia e sequência

| Fase | Entrega | Páginas afetadas | Critério de aceite |
|---|---|---|---|
| 0 — Base | Tokens, tipografia, catálogo e documentação | Nenhuma tela em produção | Tokens centralizados, contrastes revisados, sem alteração no build funcional |
| 1 — Componentes-base | Button, TextField, TextArea, Select, Card, Alert e PageHeader | Página piloto isolada | Acessibilidade por teclado, responsividade, estados, sem dependência de Supabase |
| 2 — Identidade e navegação | Barra superior/nav com destaque índigo, marca tipográfica, navegação ativa e menu mobile | `ProfessorShell`, login, cadastro e recuperação | **Código implementado; regressão manual pendente**: login/Google/logout/recuperação e menu no celular |
| 3 — Cadastros | Formulários, tabelas, estados e confirmação | `/escolas`, `/turmas`, `/alunos` | CRUD, importação de Excel/lista, vínculo de matrícula, duplicação de turma funcionando |
| 4 — Competências | Cards, pesos, filtros, ativação e biblioteca | `/competencias` | Modelos/importação, pesos 0–100 e ativação preservados |
| 5 — Avaliações (alta criticidade) | ConceptSelect, grade responsiva, badges, bloqueios e timeline | `/avaliacoes` | Mesmos conceitos/valores, média ponderada, RPC única, reabertura e snapshots sem regressão |
| 6 — Relatórios e dashboard | StatCard, DataTable, filtros, ExportActions, estilos print | `/relatorios`, `/dashboard` | CSV, impressão/PDF, cálculos e filtros preservados; folhas A4 legíveis |
| 7 — Consolidação | Auditoria final, limpeza de CSS antigo, documentação | Todas | Nenhum seletor quebrado, sem erros de console, testes intercontas e responsivos |

## 2. Aplicação por página

### Login, cadastro e recuperação
- Fundo lavanda quase branco com painel central branco, campos uniformes e botão índigo.
- OAuth Google mantém identificação própria, não simular visual de login nativo do Google.
- Não modificar `AuthForm` nem fluxo de PKCE; somente apresentação.
- Estados: submetendo, erro, confirmação do envio de link, teclado e autofill.

### Dashboard
- Header com saudação, StatCards apenas quando houver métricas verdadeiras; antes disso, manter os links funcionais sem inventar totais.
- Cartões por módulo com ícone discreto, nome e descrição; responsivos.
- Preservar atalhos existentes, especialmente Avaliações e Relatórios.

### Escolas
- Padronizar campos e botões de incluir/editar/excluir.
- Mensagem de confirmação para exclusão e erro de FK legíveis.
- Listagem agrupada, sem editar registros pertencentes a outra conta.

### Turmas
- Cards ou tabela responsiva com série, ano letivo, turno e periodicidade.
- Botão Duplicar distinto de Editar e Excluir.
- Se cópia das competências falhar, manter alerta de operação parcial.

### Alunos
- Abas Individual / Lista / Excel, com estado ativo acessível.
- Visualizar nomes, número de matrículas e ativação sem usar só cor.
- Manter processamento de arquivos `.xlsx` com a dependência existente.

### Competências
- Navegação clara entre disciplinas, modelos, competências próprias e configuração por turma.
- Exibir peso aplicado, soma dos pesos e alternância ativa/inativa com rótulos.
- Não transferir peso/competência de uma turma a outra inadvertidamente.

### Avaliações
- Densidade confortável, grade com scroll horizontal no desktop e estratégia compacta/mobile.
- Conceitos por rótulos textuais; não usar verde/vermelho como substituto de conceito.
- Botões de conclusão e revisão separados e com confirmação.
- Após conclusão, campos read-only/disabled, histórico legível.
- Ao reabrir, pedir motivo obrigatório e preservar snapshot anterior.

### Relatórios
- Cabeçalho do relatório claro e discreto, StatCards e tabelas com indicadores alinhados.
- PDF/impressão A4 usa tinta mínima e não imprime botões; separar estilos de tela e impressão.
- CSV conserva BOM/UTF-8, `;`, nome de colunas e dados filtrados.
- Diferenciar explicitamente média simples por avaliações de média por disciplina.

## 3. Qualidade — checklist por etapa

1. **Git:** alteração por módulo, commit descritivo e diff revisado; evitar substituir `globals.css` inteiro de uma vez.
2. **Build:** `npm run build` e deployment Vercel `READY` para o commit exato.
3. **Visual:** desktop 1440px, tablet 768px, mobile 375px; contraste AA, foco e estado disabled.
4. **Teclado:** Tab, Shift+Tab, Enter/Espaço, Escape onde aplicável; labels ligadas a inputs.
5. **Formulários:** submit, validação, errors, loading e estado pós-reload.
6. **Banco:** nenhum DDL ou alteração de RLS para a migração visual; nunca remover `professor_id` do escopo.
7. **Regressão:** repetir testes AV-01–AV-05, REV-01–REV-04, REL-01–REL-04 e AUTH-01.
8. **Exportação:** conferir CSV aberto no Excel e PDF A4 sem controles, dados e acentuação corretos.
9. **Volume:** tabelas largas e texto de competência extenso sem sobreposição.
10. **Dados:** testar com contas fictícias distintas; não misturar ambientes de professores.

## 4. Estados e compatibilidade

### Componentes

- `Button`: primary, secondary, ghost, danger; disabled, loading, focus-visible.
- `Field`: required, disabled, hint, error; input/textarea/select; label explícito.
- `Card`: regular, compacto e estatístico.
- `StatusBadge`: não iniciada, rascunho, concluída, revisão.
- `ConceptSelect`: o `value` permanece `nao_avaliado|ruim|regular|bom|otimo`.
- `HistoryTimeline`: datas, autores, motivo e comparação de conceitos amigáveis.
- `DataTable`: rolagem horizontal, cabeçalho `th`, indicadores legíveis.
- `ExportActions`: CSV e impressão, oculto em mídia print.

### CSS legado

O CSS atual define valores de cor diretamente em `src/app/globals.css`. **Não** importamos os novos tokens ainda. Durante a migração, trocar gradualmente propriedades (por exemplo, `background:#0b2942`) por tokens, depois eliminar os valores antigos ao final de cada módulo. Manter regras `@media print` específicas.

## 5. Gate de implantação

**Gate A — especificação aprovada:** paleta definida, tokens e docs publicados. Status: concluído.

**Gate B — primeiro componente visual:** componentes-base implementados, testados e apresentados em catálogo separado. Status: próximo.

**Gate C — navegação e formulários:** estilos aplicados nas telas de acesso e navegação, incluindo menu mobile e link ativo. **Status: implementação concluída; teste manual de autenticação e responsividade pendente.**

**Gate D — fluxos pedagógicos:** avaliações e auditoria testadas por conta, relatório impresso/exportado corretamente. Status: não iniciado.

**Gate E — conclusão:** CSS legado revisado, casos regressivos documentados, segurança API/RLS validada em paralelo. Status: não iniciado.

## 6. Não objetivos

- Mudar as regras de cálculo de notas/indicadores.
- Compartilhar informações entre professores.
- Recriar cadastros no banco ou fazer limpeza de dados.
- Introduzir novo framework UI pesado sem necessidade.
- Substituir CSV por XLSX ou impressão por PDF server-side nesta migração visual.

## 7. Registro de migração visual — 18/11/2026

- `src/styles/design-tokens.css` passou a ser importado por `src/app/globals.css`.
- `src/components/ProfessorShell.tsx`: links ativos, menu responsivo, acesso ao catálogo e logout com tratamento de erro.
- `src/components/AuthForm.tsx`: novo layout dividido no desktop e simplificado no celular; lógica de login, criação de conta, recuperação e Google OAuth preservada.
- `src/app/globals.css`: cores globais, foco, superfícies, inputs, navegação e estilos de autenticação padronizados. Regras de impressão dos relatórios preservadas.
- As páginas de escolas, turmas, alunos, competências, avaliações e relatórios receberam estilos globais, mas a revisão de componentes e grids dessas páginas segue nas fases posteriores.
- Não houve migração SQL ou alteração de RPC/RLS.
