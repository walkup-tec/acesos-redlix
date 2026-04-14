-- =============================================================================
-- Limpeza de dados para reteste (tenant Credilix por padrão)
-- =============================================================================
-- Remove:
--   - tabelas de comissão (commission_tables — inclui nomes/registros das tabelas)
--   - conteúdos (contents — arquivos e marcadores de pasta)
--   - produtos (products)
--   - bancos (banks — nomes cadastrados)
--   - usuários, exceto master@credilix.local
--
-- Ordem respeita FKs: commission_tables → contents → products → banks → users
--
-- Como executar (Supabase):
--   1. Dashboard → SQL Editor → colar este script
--   2. Se o tenant tiver outro nome, altere :tenant_name abaixo (ou ajuste o SELECT)
--   3. New query → Run
--
-- Observação: arquivos no Storage (bucket) não são apagados por este SQL; se
-- necessário, limpe o bucket manualmente no Supabase Storage.
-- =============================================================================

BEGIN;

DO $$
DECLARE
  tenant_name text := 'Credilix';  -- mesmo conceito que BOOTSTRAP_TENANT_NAME
  tid uuid;
  n_commission int;
  n_contents int;
  n_products int;
  n_banks int;
  n_users_deleted int;
BEGIN
  SELECT id INTO tid
  FROM public.tenants
  WHERE name = tenant_name
  LIMIT 1;

  IF tid IS NULL THEN
    RAISE EXCEPTION 'Tenant "%" não encontrado em public.tenants.', tenant_name;
  END IF;

  DELETE FROM public.commission_tables WHERE tenant_id = tid;
  GET DIAGNOSTICS n_commission = ROW_COUNT;

  DELETE FROM public.contents WHERE tenant_id = tid;
  GET DIAGNOSTICS n_contents = ROW_COUNT;

  DELETE FROM public.products WHERE tenant_id = tid;
  GET DIAGNOSTICS n_products = ROW_COUNT;

  DELETE FROM public.banks WHERE tenant_id = tid;
  GET DIAGNOSTICS n_banks = ROW_COUNT;

  DELETE FROM public.users
  WHERE tenant_id = tid
    AND lower(trim(email)) <> lower('master@credilix.local');
  GET DIAGNOSTICS n_users_deleted = ROW_COUNT;

  RAISE NOTICE 'commission_tables removidos: %', n_commission;
  RAISE NOTICE 'contents removidos: %', n_contents;
  RAISE NOTICE 'products removidos: %', n_products;
  RAISE NOTICE 'banks removidos: %', n_banks;
  RAISE NOTICE 'users removidos (exceto master): %', n_users_deleted;
END $$;

COMMIT;
