-- Portal do Professor | V0.6 | Auditoria somente leitura
-- Execute no SQL Editor do Supabase do Portal do Professor.
-- Nao altera tabelas, notas, matriculas ou usuarios.

-- 1. Estrutura e tipos das duas tabelas de avaliacao
SELECT table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('avaliacoes','avaliacao_itens')
ORDER BY table_name, ordinal_position;

-- 2. Chaves, UNIQUE, CHECK e FOREIGN KEY
SELECT conrelid::regclass::text AS tabela, conname AS restricao,
       contype AS tipo,
       pg_get_constraintdef(oid, true) AS definicao
FROM pg_constraint
WHERE conrelid IN ('public.avaliacoes'::regclass, 'public.avaliacao_itens'::regclass)
ORDER BY tabela, tipo, restricao;

-- 3. Indices (inclusive indices unicos)
SELECT tablename AS tabela, indexname AS indice, indexdef AS definicao
FROM pg_indexes
WHERE schemaname='public'
  AND tablename IN ('avaliacoes','avaliacao_itens')
ORDER BY tablename,indexname;

-- 4. Triggers nao internos e suas funcoes
SELECT c.relname AS tabela, t.tgname AS gatilho, t.tgenabled AS habilitado,
       pg_get_triggerdef(t.oid,true) AS definicao,
       t.tgfoid::regprocedure::text AS funcao
FROM pg_trigger t
JOIN pg_class c ON c.oid=t.tgrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('avaliacoes','avaliacao_itens')
  AND NOT t.tgisinternal
ORDER BY c.relname,t.tgname;

-- 5. Detectar duplicidades de cabecalhos sem expor nomes nem UUIDs
SELECT 'avaliacoes' AS tabela,
       count(*) AS grupos_duplicados,
       coalesce(sum(quantidade-1),0) AS registros_excedentes
FROM (
 SELECT count(*) AS quantidade
 FROM public.avaliacoes
 GROUP BY professor_id,matricula_id,disciplina_id,periodo_rotulo
 HAVING count(*)>1
) x
UNION ALL
SELECT 'avaliacao_itens',
       count(*),
       coalesce(sum(quantidade-1),0)
FROM (
 SELECT count(*) AS quantidade
 FROM public.avaliacao_itens
 GROUP BY avaliacao_id,competencia_id
 HAVING count(*)>1
) x;

-- 6. Quantidade por status (sem dados pessoais)
SELECT status::text AS status, count(*) AS registros
FROM public.avaliacoes
GROUP BY status
ORDER BY status;

-- 7. Políticas de acesso aplicadas
SELECT tablename AS tabela, policyname AS politica, cmd AS comando,
       roles AS perfis, qual AS usando, with_check AS com_verificacao
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('avaliacoes','avaliacao_itens')
ORDER BY tablename,policyname;
