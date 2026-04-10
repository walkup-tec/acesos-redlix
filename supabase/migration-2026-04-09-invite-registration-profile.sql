-- Campos adicionais no cadastro por convite (validação do convidado) e verso do documento.
alter table public.users add column if not exists father_name text;
alter table public.users add column if not exists mother_name text;
alter table public.users add column if not exists zip_code text;
alter table public.users add column if not exists street text;
alter table public.users add column if not exists neighborhood text;
alter table public.users add column if not exists city text;
alter table public.users add column if not exists state text;
alter table public.users add column if not exists address_number text;
alter table public.users add column if not exists address_complement text;
alter table public.users add column if not exists identity_document_back_path text;
