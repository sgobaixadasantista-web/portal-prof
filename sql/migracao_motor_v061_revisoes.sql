-- Portal do Professor — Motor V0.6.1: reabertura controlada e auditoria
-- EXECUTAR APÓS sql/migracao_motor_v06.sql, no Supabase do Portal do Professor.
-- Registra cada reabertura e o estado completo antes/depois. Não exclui dados.
BEGIN;

CREATE TABLE IF NOT EXISTS public.avaliacao_revisoes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 avaliacao_id uuid NOT NULL,
 professor_id uuid NOT NULL,
 autor_id uuid NOT NULL,
 motivo text NOT NULL CHECK (length(btrim(motivo)) BETWEEN 10 AND 1000),
 reaberta_em timestamptz NOT NULL DEFAULT now(),
 snapshot_antes jsonb NOT NULL,
 encerrada_em timestamptz,
 encerrada_por uuid,
 snapshot_depois jsonb,
 CONSTRAINT avaliacao_revisoes_avaliacao_fk
  FOREIGN KEY (avaliacao_id,professor_id)
  REFERENCES public.avaliacoes(id,professor_id) ON DELETE RESTRICT,
 CONSTRAINT avaliacao_revisoes_autor_fk
  FOREIGN KEY (autor_id) REFERENCES public.professores(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS avaliacao_revisoes_uma_aberta
 ON public.avaliacao_revisoes(avaliacao_id) WHERE encerrada_em IS NULL;
CREATE INDEX IF NOT EXISTS avaliacao_revisoes_professor_avaliacao
 ON public.avaliacao_revisoes(professor_id,avaliacao_id,reaberta_em DESC);

ALTER TABLE public.avaliacao_revisoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS avaliacao_revisoes_select ON public.avaliacao_revisoes;
CREATE POLICY avaliacao_revisoes_select ON public.avaliacao_revisoes
 FOR SELECT TO authenticated
 USING (professor_id=(select auth.uid()));
REVOKE ALL ON public.avaliacao_revisoes FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.avaliacao_revisoes TO authenticated;

-- Permite apenas a transição concluída -> rascunho feita pela RPC autorizada.
-- A checagem de dono e papel efetivo impede que um cliente autenticado
-- burle o gatilho apenas definindo uma variável de sessão.
CREATE OR REPLACE FUNCTION public.motor_v06_proteger_avaliacao()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
DECLARE
 v_dono_funcao text;
BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD.status='concluida' THEN
   RAISE EXCEPTION 'Avaliações concluídas não podem ser excluídas.' USING ERRCODE='23514';
  END IF;
  RETURN OLD;
 END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.status='concluida' THEN
   RAISE EXCEPTION 'Crie um rascunho antes de concluir.' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
 END IF;
 IF OLD.status='concluida' THEN
  SELECT pg_catalog.pg_get_userbyid(p.proowner) INTO v_dono_funcao
   FROM pg_catalog.pg_proc p
   WHERE p.oid='public.motor_v061_reabrir_avaliacao(uuid,text)'::pg_catalog.regprocedure;
  IF NEW.status='rascunho'
   AND current_user=v_dono_funcao
   AND pg_catalog.current_setting('portal_prof.reabertura_v061',true)='autorizada'
   AND auth.uid()=OLD.professor_id
   AND (pg_catalog.to_jsonb(NEW)-'status'-'atualizado_em') =
       (pg_catalog.to_jsonb(OLD)-'status'-'atualizado_em') THEN
     RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Avaliação concluída: utilize a reabertura auditada.' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;

-- Reabertura auditada, com verificação explícita do professor autenticado.
-- SECURITY DEFINER é necessário para inserir na tabela de auditoria
-- (sem permissão de escrita para o cliente). A função não aceita professor_id.
CREATE OR REPLACE FUNCTION public.motor_v061_reabrir_avaliacao(
 p_avaliacao_id uuid,
 p_motivo text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
 v_avaliacao public.avaliacoes%ROWTYPE;
 v_autor uuid := auth.uid();
 v_snapshot jsonb;
BEGIN
 IF v_autor IS NULL THEN
  RAISE EXCEPTION 'Autenticação obrigatória.' USING ERRCODE='42501';
 END IF;
 IF p_motivo IS NULL OR length(btrim(p_motivo)) NOT BETWEEN 10 AND 1000 THEN
  RAISE EXCEPTION 'Informe um motivo de 10 a 1000 caracteres.' USING ERRCODE='23514';
 END IF;
 SELECT * INTO v_avaliacao FROM public.avaliacoes
 WHERE id=p_avaliacao_id AND professor_id=v_autor
 FOR UPDATE;
 IF NOT FOUND THEN
  RAISE EXCEPTION 'Avaliação inexistente ou sem permissão.' USING ERRCODE='42501';
 END IF;
 IF v_avaliacao.status<>'concluida' THEN
  RAISE EXCEPTION 'Somente avaliações concluídas podem ser reabertas.' USING ERRCODE='23514';
 END IF;
 IF EXISTS(SELECT 1 FROM public.avaliacao_revisoes WHERE avaliacao_id=p_avaliacao_id AND encerrada_em IS NULL) THEN
  RAISE EXCEPTION 'Já existe uma revisão aberta.' USING ERRCODE='23514';
 END IF;

 SELECT pg_catalog.jsonb_build_object(
   'avaliacao', pg_catalog.to_jsonb(v_avaliacao),
   'itens', COALESCE(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.competencia_id)
                     FILTER(WHERE i.id IS NOT NULL),'[]'::jsonb)
 )
 INTO v_snapshot
 FROM public.avaliacao_itens i WHERE i.avaliacao_id=p_avaliacao_id;

 INSERT INTO public.avaliacao_revisoes
 (avaliacao_id,professor_id,autor_id,motivo,snapshot_antes)
 VALUES(p_avaliacao_id,v_autor,v_autor,btrim(p_motivo),v_snapshot);

 PERFORM pg_catalog.set_config('portal_prof.reabertura_v061','autorizada',true);
 UPDATE public.avaliacoes SET status='rascunho',atualizado_em=now()
 WHERE id=p_avaliacao_id AND professor_id=v_autor;
 PERFORM pg_catalog.set_config('portal_prof.reabertura_v061','',true);
 RETURN p_avaliacao_id;
END;
$$;
REVOKE ALL ON FUNCTION public.motor_v061_reabrir_avaliacao(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.motor_v061_reabrir_avaliacao(uuid,text) TO authenticated;

-- Ao concluir uma revisão, registra estado final e identidade de quem concluiu.
CREATE OR REPLACE FUNCTION public.motor_v061_encerrar_revisao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
 v_snapshot jsonb;
BEGIN
 IF EXISTS (SELECT 1 FROM public.avaliacao_revisoes
             WHERE avaliacao_id=NEW.id AND encerrada_em IS NULL) THEN
  SELECT pg_catalog.jsonb_build_object(
    'avaliacao',pg_catalog.to_jsonb(NEW),
    'itens',COALESCE(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.competencia_id)
                   FILTER(WHERE i.id IS NOT NULL),'[]'::jsonb)
  ) INTO v_snapshot
  FROM public.avaliacao_itens i WHERE i.avaliacao_id=NEW.id;

  UPDATE public.avaliacao_revisoes
  SET encerrada_em=now(),encerrada_por=auth.uid(),snapshot_depois=v_snapshot
  WHERE avaliacao_id=NEW.id AND encerrada_em IS NULL;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.motor_v061_encerrar_revisao() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS motor_v061_encerrar_revisao ON public.avaliacoes;
CREATE TRIGGER motor_v061_encerrar_revisao
 AFTER UPDATE OF status ON public.avaliacoes
 FOR EACH ROW
 WHEN (OLD.status='rascunho' AND NEW.status='concluida')
 EXECUTE FUNCTION public.motor_v061_encerrar_revisao();

COMMIT;

-- TESTE SOMENTE LEITURA (após aplicar):
-- SELECT proname, prosecdef FROM pg_proc WHERE proname='motor_v061_reabrir_avaliacao';
-- SELECT count(*) FROM public.avaliacao_revisoes;
-- SELECT tgname FROM pg_trigger WHERE tgrelid='public.avaliacoes'::regclass AND NOT tgisinternal;
