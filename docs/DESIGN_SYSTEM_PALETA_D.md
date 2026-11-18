# Design System do Portal do Professor — Paleta D

**Status:** especificação aprovada para adoção; migração visual ainda não aplicada nas telas.
**Versão do Design System:** 1.0.0 (especificação inicial)
**Data:** 18/11/2026
**Escopo:** Next.js, React e CSS; telas de autenticação, dashboard, escolas, turmas, alunos, competências, avaliações e relatórios.

## 1. Identidade e princípios

**Nome interno:** Criativa Contemporânea.

- **Personalidade:** acolhedora, contemporânea, organizada e confiável; não infantilizar a interface.
- **Base:** índigo profundo `#5146A5`, lavanda `#987AC6`, pêssego `#E6A06A`, fundo muito claro `#F8F7FC`, superfícies brancas.
- **Foco:** formulários operacionais rápidos, ótima legibilidade de notas, tabelas densas quando necessário, relatórios neutros para impressão.
- **Acessibilidade:** texto e componentes com contraste verificado no uso concreto; foco visível, navegação por teclado, estados com rótulo, redução de movimento.
- **Integridade:** Design System **não altera** regras, valores de conceito, pesos históricos, conclusão, auditoria, RLS, RPC ou exportações.

## 2. Paleta cromática

| Papel | Token | Hex | Aplicação |
|---|---|---|---|
| Primária | `--pp-color-primary` | `#5146A5` | botões, navegação ativa, links de ação |
| Primária hover | `--pp-color-primary-hover` | `#453993` | hover |
| Primária pressed | `--pp-color-primary-active` | `#3B337C` | pressionado |
| Lavanda | `--pp-color-accent` | `#987AC6` | decoração, ilustrações, barras de gráficos; **não** texto pequeno branco |
| Pêssego | `--pp-color-highlight` | `#E6A06A` | destaque sutil, gráfico, marcação; **não** texto branco pequeno |
| Página | `--pp-color-page` | `#F8F7FC` | fundo |
| Superfície | `--pp-color-surface` | `#FFFFFF` | cards, modais, tabelas |
| Superfície suave | `--pp-color-surface-soft` | `#F1F0FA` | seleção, seções alternadas |
| Texto principal | `--pp-color-text` | `#242338` | títulos, corpo |
| Texto secundário | `--pp-color-text-muted` | `#5F6179` | descrições, legendas |
| Bordas | `--pp-color-border` | `#E3E0ED` | separadores, inputs |
| Links | `--pp-color-link` | `#453993` | links de conteúdo |
| Foco | `--pp-color-focus` | `#3B337C` | indicador de foco externo |
| Sucesso | `--pp-color-success` | `#18794E` | salvo, concluída |
| Atenção | `--pp-color-warning` | `#9A6700` | rascunho, revisão em andamento |
| Erro | `--pp-color-danger` | `#B42332` | falhas, confirmação destrutiva |
| Informação | `--pp-color-info` | `#205DB5` | orientação |

### Contrastes de referência

- `#5146A5` sobre branco: aproximadamente **7,58:1** (apto para texto normal).
- `#987AC6` sobre branco: aproximadamente **3,54:1** (**não** usar como texto pequeno, texto branco sobre lavanda ou link sem ajuste).
- `#E6A06A` sobre branco: aproximadamente **2,19:1** (**não** usar como cor de texto pequena).
- `#5F6179` sobre branco: aproximadamente **6,05:1**.
- Objetivos: WCAG 2.2 AA, 4,5:1 para texto normal, 3:1 para texto grande e componentes não textuais relevantes. Valores devem ser reavaliados com cada combinação final, inclusive estados disabled, hover e gráficos.

### Papéis vs. valores

Componentes **devem usar tokens semânticos**, por exemplo `var(--pp-color-primary)`, e não espalhar valores `#5146A5` pelo JSX. Primitivos e tokens ficam em [`src/styles/design-tokens.css`](../src/styles/design-tokens.css), criado sem ser importado para evitar mudança visual prematura.

## 3. Tipografia

**Família:** Inter, com fallback `system-ui, -apple-system, Segoe UI, sans-serif`. Não exigir fonte em todos os clientes antes de importá-la corretamente no Next.js. Usar tabular nums para números, indicadores e tabelas.

| Estilo | Fonte | Peso | Line-height | Uso |
|---|---|---|---|---|
| Display/total | 30px | 700 | 1.25 | valores destacados |
| H1 | 30px desktop / 24px mobile | 700 | 1.25 | título de página |
| H2 | 24px | 600 | 1.25 | título de seção |
| H3 | 20px | 600 | 1.3 | card e subtítulo |
| Body | 16px | 400 | 1.55 | texto de apoio e formulários |
| Body compacto | 14px | 400/500 | 1.5 | tabelas, descrições |
| Caption | 12px | 400/500 | 1.4 | legendas e metadados; não textos críticos longos |
| Botão | 14px | 600 | 1.3 | ações |

Evitar caixa alta prolongada; usar rótulos como “Concluída”, “Rascunho” e “Não avaliado”. Números: `font-variant-numeric: tabular-nums` para alinhamento.

## 4. Espaçamento, forma e layout

- Grid base de **4px**: 4, 8, 12, 16, 20, 24, 32, 40 e 48px.
- `--pp-height-control: 44px` para inputs e ações primárias. Área clicável recomendada de 44×44px.
- Raios: 6px para itens pequenos, 10px inputs/botões, 14px cards, 18px contêineres maiores, pill para etiquetas.
- Sombras suaves; não depender exclusivamente da sombra para delimitar cartões.
- Content max-width inicial: **1152px**, com largura fluida e padding 16px mobile / 24–32px desktop.
- Breakpoints de referência: **mobile abaixo de 640px; tablet 640–1023px; desktop a partir de 1024px**.
- Reduzir movimento respeitando `prefers-reduced-motion`; transições comuns 120–200ms.

## 5. Componentes — API e estados mínimos

| Componente | Variantes / propriedades | Estados e requisitos |
|---|---|---|
| **AppShell** | cabeçalho, nav desktop, menu mobile, conteúdo | sem mudar `ProfessorShell`/Auth; foco e logout preservados |
| **PageHeader** | título, resumo, ação secundária | responsivo; hierarquia semântica |
| **Button** | primary, secondary, outline, ghost, danger; sm/md/lg | default, hover, focus-visible, disabled, loading; não disparar ação duplicada |
| **TextField** | texto, email, senha, numérico | label, hint, erro, required, disabled |
| **TextArea** | observações e motivo de revisão | contador quando necessário, erros, altura responsiva |
| **Select** | simples e filtros | placeholder, optgroup quando necessário, navegação teclado |
| **SegmentedTabs** | Individual / Turma / Evolução | seleção acessível, persistência de foco |
| **Card / StatCard** | regular, compact, indicador | rótulo e unidade explícitos, alvos de clique claros |
| **DataTable** | normal, compacta, overflow horizontal | headers semânticos, estados vazio/loading/erro, cabeçalho legível |
| **ConceptSelect** | Não avaliado, Ruim, Regular, Bom, Ótimo | **valor interno idêntico ao banco**; conceito sempre textual; não usar só cor |
| **StatusBadge** | não iniciada, rascunho, concluída, revisão em andamento | rótulo + contraste; nunca só cor |
| **Alert / Toast** | sucesso, informação, atenção, erro | `role=status` ou `role=alert`; mensagem suficiente |
| **ConfirmDialog** | exclusão, reabertura | foco em modal, Escape, cancelar claro, irreversibilidade identificada |
| **HistoryTimeline** | revisão, data, autor, motivo, diffs | texto legível, conceito com label humanizado, snapshots preservados |
| **ExportActions** | CSV, PDF/impressão | somente concluídas filtradas; esconder controles no print |
| **EmptyState / Skeleton** | sem dados, carregando, erro | ação de recuperação contextual |

### Regras específicas das avaliações

- Tokens semânticos para status: **rascunho = atenção**, **concluída = sucesso**, **revisão = informação/atenção**.
- Os conceitos pedagógicos **não** são severidades técnicas. Não interpretar “Ruim” como falha de sistema nem pintar toda uma linha de vermelho.
- O valor da média permanece matematicamente igual (Ruim 2,5; Regular 5; Bom 7,5; Ótimo 10; Não avaliado = null). Os pesos nunca são alterados por mudança visual.
- Em avaliação concluída, o bloqueio e a reabertura precisam continuar íntegros, inclusive em teclado e dispositivos móveis.

## 6. Guia para relatórios PDF/CSV

- Tela: utilizar cor primária em cabeçalhos discretos e estatísticas.
- **Impressão:** fundo branco, texto escuro, bordas neutras; não imprimir sombras, nav, barras de filtro nem botões.
- Tabelas longas: cabeçalhos repetidos por página quando viável, evitar quebra dentro das linhas, testar A4.
- Nunca substituir notas por apenas gráficos. CSV deve exportar o mesmo conjunto filtrado usado no relatório visível.
- Impressão usa `window.print` e CSV é arquivo separado por `;`. Não rotular como geração automática de `.xlsx` ou PDF server-side.

## 7. Proteção de funcionalidades

**Invariantes em cada mudança de CSS ou componente:**
1. Login/cadastro/recuperação e redirecionamento permanecem intactos.
2. Consultas só exibem dados do professor autenticado; não remover RLS nem filtros por `professor_id`.
3. Escolas, turmas, alunos e competências mantêm CRUD, importação, vínculos e pesos.
4. Salvamento continua por `motor_v06_salvar_avaliacao`, uma transação por avaliação.
5. Reabertura continua por `motor_v061_reabrir_avaliacao`, com justificativa e snapshots.
6. Conceitos, pesos históricos e status mantêm valores e regras atuais.
7. Relatórios preservam filtros, média, evolução, CSV e impressão.
8. Não adicionar compartilhamento entre professores na V1.

## 8. Estratégia de código

**Fase inicial (sem impacto):** arquivo `src/styles/design-tokens.css` versionado, **não importado**. Validar documentação, contraste e componentes em uma página de catálogo isolada ou storybook simples.

**Adoção:** importar tokens no `layout.tsx` ou no `globals.css` apenas quando componentes piloto estiverem aprovados; trocar valores literais por `var(--pp-...)`. Evitar substituir tudo de uma vez.

**Estrutura sugerida:**

```text
src/
  styles/
    design-tokens.css
    components.css       # após piloto
  components/
    ui/
      Button.tsx
      TextField.tsx
      Select.tsx
      Card.tsx
      StatusBadge.tsx
      ...
docs/
  DESIGN_SYSTEM_PALETA_D.md
  PLANO_MIGRACAO_DESIGN_SYSTEM.md
```

A implementação de componentes React compartilhados deve preservar nomes, `type`, `onChange`, `disabled`, semântica de formulário, estados de loading e as chamadas RPC. Usar componentes controlados apenas onde já há estado controlado, sem alterações de lógica.

## 9. Referências

- [Tokens CSS](../src/styles/design-tokens.css)
- [Plano de migração](./PLANO_MIGRACAO_DESIGN_SYSTEM.md)
- [Manual funcional](./MANUAL_FUNCIONAL.md)
- [Arquitetura](./ARQUITETURA_E_FUNCOES.md)
- [WCAG — Contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
