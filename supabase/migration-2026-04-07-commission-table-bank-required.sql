-- Campo obrigatório "bank" na tabela de comissão.
-- Em registros antigos, popular com valor padrão para permitir NOT NULL.

alter table public.commission_tables
add column if not exists bank text;

update public.commission_tables
set bank = coalesce(nullif(trim(bank), ''), 'N/A')
where bank is null or trim(bank) = '';

alter table public.commission_tables
alter column bank set not null;
