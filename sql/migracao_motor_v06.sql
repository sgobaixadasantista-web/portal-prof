-- Portal do Professor · V0.6 — Motor transacional de avaliações
-- PRE-REQUISITO: auditoria sem registros duplicados e sem triggers nas tabelas de avaliações.
-- EXECUÇÃO: SQL Editor do Supabase do Portal do Professor (não executar em outros projetos).
-- Preserva todos os registros atuais. Não apaga avaliações, alunos ou competências.
BEGIN;

-- Uma única avaliação por aluno, disciplina e período, independentemente de status.
CREATE UNIQUE INDEX IF NOT EXISTS avaliacoes_unica_matricula_disciplina_periodo
 ON public.avaliacoes (professor_id, matricula_id, disciplina_id, periodo_rotulo);

-- Congela avaliações concluídas: atualização, exclusão e inserção direta concluída.
CREATE OR REPLACE FUNCTION public.motor_v06_proteger_avaliacao()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
 IF TG_OP = 'DELETE' THEN
   IF OLD.status = 'concluida' THEN
     RAISE EXCEPTION 'Avaliações concluídas não podem ser excluídas.'
       USING ERRCODE='23514';
   END IF;
   RETURN OLD;
 END IF;
 IF TG_OP = 'INSERT' THEN
   IF NEW.status = 'concluida' THEN
     RAISE EXCEPTION 'Crie um rascunho antes de concluir a avaliação.'
       USING ERRCODE='23514';
   END IF;
   RETURN NEW;
 END IF;
 IF OLD.status = 'concluida' THEN
   RAISE EXCEPTION 'Avaliações concluídas não podem ser alteradas.'
     USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS motor_v06_proteger_avaliacao ON public.avaliacoes;
CREATE TRIGGER motor_v06_proteger_avaliacao
 BEFORE INSERT OR UPDATE OR DELETE ON public.avaliacoes
 FOR EACH ROW EXECUTE FUNCTION public.motor_v06_proteger_avaliacao();

-- Impede qualquer mudança nos itens quando a avaliação já estiver concluída.
CREATE OR REPLACE FUNCTION public.motor_v06_proteger_item()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
DECLARE v_status text;
BEGIN
 SELECT a.status INTO v_status
 FROM public.avaliacoes a
 WHERE a.id = COALESCE(NEW.avaliacao_id, OLD.avaliacao_id)
 FOR UPDATE;

 IF v_status IS NULL THEN
   RAISE EXCEPTION 'Avaliação não encontrada.'
     USING ERRCODE='23503';
 END IF;
 IF v_status = 'concluida' THEN
   RAISE EXCEPTION 'Itens de avaliações concluídas não podem ser alterados.'
     USING ERRCODE='23514';
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS motor_v06_proteger_item ON public.avaliacao_itens;
CREATE TRIGGER motor_v06_proteger_item
 BEFORE INSERT OR UPDATE OR DELETE ON public.avaliacao_itens
 FOR EACH ROW EXECUTE FUNCTION public.motor_v06_proteger_item();

-- Indicador calculado exclusivamente a partir dos conceitos e pesos históricos.
-- "nao_avaliado" e pesos iguais a zero não entram no cálculo.
CREATE OR REPLACE VIEW public.motor_v06_indicadores
WITH (security_invoker = true) AS
SELECT a.id AS avaliacao_id,
       a.professor_id,
       a.matricula_id,
       a.disciplina_id,
       a.periodo_rotulo,
       a.status,
       COUNT(i.avaliacao_id) AS total_criterios,
       COUNT(*) FILTER (WHERE i.conceito <> 'nao_avaliado' AND i.peso_aplicado > 0) AS criterios_avaliados,
       ROUND(
         (
           SUM(
             CASE WHEN i.conceito <> 'nao_avaliado' AND i.peso_aplicado > 0
             THEN (CASE i.conceito
                WHEN 'ruim' THEN 2.5
                WHEN 'regular' THEN 5.0
                WHEN 'bom' THEN 7.5
                WHEN 'otimo' THEN 10.0
                ELSE 0 END) * i.peso_aplicado
             ELSE 0 END
           ) /
           NULLIF(SUM(CASE WHEN i.conceito <> 'nao_avaliado' AND i.peso_aplicado > 0
             THEN i.peso_aplicado ELSE 0 END),0)
         )::numeric, 1
       ) AS indicador
FROM public.avaliacoes a
LEFT JOIN public.avaliacao_itens i ON i.avaliacao_id=a.id
GROUP BY a.id,a.professor_id,a.matricula_id,a.disciplina_id,a.periodo_rotulo,a.status;

GRANT SELECT ON public.motor_v06_indicadores TO authenticated;

-- Salva cabeçalho + conjunto completo de itens + conclusão em uma única transação.
-- Use este RPC para inserir/editar rascunhos; em caso de erro, nada será gravado.
CREATE OR REPLACE FUNCTION public.motor_v06_salvar_avaliacao(
 p_matricula_id uuid,
 p_disciplina_id uuid,
 p_periodo_rotulo text,
 p_data_avaliacao date,
 p_observacoes text,
 p_itens jsonb,
 p_concluir boolean DEFAULT false
)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
 v_professor uuid := auth.uid();
 v_turma_id uuid;
 v_avaliacao_id uuid;
 v_status text;
 v_item jsonb;
 v_competencia_id uuid;
 v_conceito text;
 v_nome text;
 v_peso numeric;
 v_total integer := 0;
 v_validos integer := 0;
 v_distintos integer;
 v_habilitados integer;
BEGIN
 IF v_professor IS NULL THEN
   RAISE EXCEPTION 'Autenticação obrigatória.' USING ERRCODE='42501';
 END IF;

 SELECT m.turma_id INTO v_turma_id FROM public.matriculas m
 WHERE m.id=p_matricula_id AND m.professor_id=v_professor AND m.ativo=true;
 IF v_turma_id IS NULL THEN
   RAISE EXCEPTION 'Matrícula não encontrada ou inativa.' USING ERRCODE='23514';
 END IF;

 IF NOT EXISTS (SELECT 1 FROM public.disciplinas d WHERE d.id=p_disciplina_id AND d.professor_id=v_professor) THEN
   RAISE EXCEPTION 'Disciplina não pertence ao professor.' USING ERRCODE='23514';
 END IF;
 IF p_periodo_rotulo IS NULL OR length(btrim(p_periodo_rotulo)) NOT BETWEEN 1 AND 100
    OR p_data_avaliacao IS NULL THEN
   RAISE EXCEPTION 'Período e data válidos são obrigatórios.' USING ERRCODE='23514';
 END IF;
 IF p_itens IS NULL OR jsonb_typeof(p_itens)<>'array' THEN
   RAISE EXCEPTION 'Itens devem ser um array JSON.' USING ERRCODE='22023';
 END IF;

 -- Bloqueia concorrência para este cabeçalho. Índice UNIQUE previne inserções simultâneas.
 SELECT a.id,a.status INTO v_avaliacao_id,v_status
 FROM public.avaliacoes a
 WHERE a.professor_id=v_professor AND a.matricula_id=p_matricula_id
   AND a.disciplina_id=p_disciplina_id AND a.periodo_rotulo=btrim(p_periodo_rotulo)
 FOR UPDATE;
 IF v_status='concluida' THEN
   RAISE EXCEPTION 'Avaliação concluída não pode ser modificada.' USING ERRCODE='23514';
 END IF;

 SELECT COUNT(*) INTO v_habilitados
 FROM public.turma_competencias tc
 JOIN public.competencias c ON c.id=tc.competencia_id AND c.professor_id=v_professor
 WHERE tc.professor_id=v_professor AND tc.turma_id=v_turma_id AND tc.ativa=true
   AND c.disciplina_id=p_disciplina_id AND c.ativa=true
   AND (c.ano_escolar IS NULL OR c.ano_escolar=(SELECT t.ano_escolar FROM public.turmas t WHERE t.id=v_turma_id));
 IF v_habilitados=0 THEN
   RAISE EXCEPTION 'Não há competências ativas para esta disciplina e turma.' USING ERRCODE='23514';
 END IF;
 IF jsonb_array_length(p_itens)<>v_habilitados THEN
   RAISE EXCEPTION 'Envie todas as competências ativas da turma (esperadas: %).',v_habilitados USING ERRCODE='23514';
 END IF;

 SELECT COUNT(DISTINCT item->>'competencia_id') INTO v_distintos
 FROM jsonb_array_elements(p_itens) item;
 IF v_distintos<>jsonb_array_length(p_itens) THEN
   RAISE EXCEPTION 'Existem competências duplicadas ou sem identificação.' USING ERRCODE='23514';
 END IF;

 -- Valida o conjunto completo antes de gravar qualquer registro.
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_itens) LOOP
   v_competencia_id := (v_item->>'competencia_id')::uuid;
   v_conceito := v_item->>'conceito';
   IF v_conceito NOT IN ('ruim','regular','bom','otimo','nao_avaliado') OR v_conceito IS NULL THEN
     RAISE EXCEPTION 'Conceito inválido.' USING ERRCODE='23514';
   END IF;
   SELECT c.nome,tc.peso INTO v_nome,v_peso
   FROM public.turma_competencias tc
   JOIN public.competencias c ON c.id=tc.competencia_id
   WHERE tc.professor_id=v_professor AND tc.turma_id=v_turma_id AND tc.ativa=true
     AND c.professor_id=v_professor AND c.id=v_competencia_id
     AND c.ativa=true AND c.disciplina_id=p_disciplina_id
     AND (c.ano_escolar IS NULL OR c.ano_escolar=(SELECT t.ano_escolar FROM public.turmas t WHERE t.id=v_turma_id));
   IF NOT FOUND OR v_peso IS NULL OR v_peso<0 OR v_peso>100 THEN
     RAISE EXCEPTION 'Competência inválida ou peso fora de 0 a 100.' USING ERRCODE='23514';
   END IF;
   IF v_conceito<>'nao_avaliado' AND v_peso>0 THEN v_validos:=v_validos+1; END IF;
   v_total:=v_total+1;
 END LOOP;

 IF p_concluir AND v_validos=0 THEN
   RAISE EXCEPTION 'Avalie ao menos uma competência com peso positivo antes de concluir.' USING ERRCODE='23514';
 END IF;

 IF v_avaliacao_id IS NULL THEN
   INSERT INTO public.avaliacoes
    (professor_id,matricula_id,disciplina_id,periodo_rotulo,data_avaliacao,observacoes,status)
   VALUES
    (v_professor,p_matricula_id,p_disciplina_id,btrim(p_periodo_rotulo),
     p_data_avaliacao,nullif(btrim(p_observacoes),''),'rascunho')
   RETURNING id INTO v_avaliacao_id;
 ELSE
   UPDATE public.avaliacoes SET data_avaliacao=p_data_avaliacao,
      observacoes=nullif(btrim(p_observacoes),''),status='rascunho',
      atualizado_em=now()
   WHERE id=v_avaliacao_id AND professor_id=v_professor;
 END IF;

 -- Atualização integral em rascunho; avaliações concluídas ficam imutáveis.
 DELETE FROM public.avaliacao_itens
 WHERE avaliacao_id=v_avaliacao_id AND professor_id=v_professor;

 FOR v_item IN SELECT value FROM jsonb_array_elements(p_itens) LOOP
   v_competencia_id:=(v_item->>'competencia_id')::uuid;
   SELECT c.nome,tc.peso INTO v_nome,v_peso
   FROM public.turma_competencias tc
   JOIN public.competencias c ON c.id=tc.competencia_id
   WHERE tc.professor_id=v_professor AND tc.turma_id=v_turma_id AND tc.competencia_id=v_competencia_id;
   INSERT INTO public.avaliacao_itens
    (professor_id,avaliacao_id,competencia_id,conceito,peso_aplicado,competencia_nome_snapshot)
   VALUES (v_professor,v_avaliacao_id,v_competencia_id,v_item->>'conceito',v_peso,v_nome);
 END LOOP;

 IF p_concluir THEN
   UPDATE public.avaliacoes SET status='concluida',atualizado_em=now()
   WHERE id=v_avaliacao_id AND professor_id=v_professor;
 END IF;
 RETURN v_avaliacao_id;
END;
$$;
REVOKE ALL ON FUNCTION public.motor_v06_salvar_avaliacao(uuid,uuid,text,date,text,jsonb,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.motor_v06_salvar_avaliacao(uuid,uuid,text,date,text,jsonb,boolean) TO authenticated;
COMMIT;

-- Verificação pós-migração:
-- SELECT indexname FROM pg_indexes WHERE tablename='avaliacoes' AND indexname='avaliacoes_unica_matricula_disciplina_periodo';
-- SELECT tgname FROM pg_trigger WHERE tgrelid='public.avaliacoes'::regclass AND NOT tgisinternal;
-- SELECT * FROM public.motor_v06_indicadores LIMIT 5;
