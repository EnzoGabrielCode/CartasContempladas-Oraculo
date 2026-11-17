-- Rode isto no Supabase: SQL Editor > New query > Run
-- Cria a lista de administradoras (com logo) e o armazenamento das imagens.

create table if not exists public.administradoras (
  id         bigint generated always as identity primary key,
  nome       text not null unique,
  logo_url   text,
  created_at timestamptz not null default now()
);

alter table public.administradoras enable row level security;

drop policy if exists "publico le administradoras" on public.administradoras;
create policy "publico le administradoras" on public.administradoras
  for select to anon, authenticated using (true);

drop policy if exists "admin escreve administradoras" on public.administradoras;
create policy "admin escreve administradoras" on public.administradoras
  for all to authenticated using (true) with check (true);

-- Lista inicial (as logos você coloca pelo painel)
insert into public.administradoras (nome) values
  ('Caixa'), ('Itaú'), ('Bradesco'), ('Santander'), ('Banco do Brasil'),
  ('CNP Embracon'), ('Porto Seguro'), ('Rodobens'), ('Ademicon'),
  ('HS Consórcios'), ('MyCon'), ('Sicredi'), ('Sicoob')
on conflict (nome) do nothing;

-- Inclui também as administradoras que já estão nas cartas cadastradas
insert into public.administradoras (nome)
  select distinct trim(administradora) from public.cartas
  where administradora is not null and trim(administradora) <> ''
on conflict (nome) do nothing;

-- Pasta pública para as logos
insert into storage.buckets (id, name, public)
  values ('logos', 'logos', true)
on conflict (id) do update set public = true;

drop policy if exists "logos leitura publica" on storage.objects;
create policy "logos leitura publica" on storage.objects
  for select to anon, authenticated using (bucket_id = 'logos');

drop policy if exists "logos admin envia" on storage.objects;
create policy "logos admin envia" on storage.objects
  for insert to authenticated with check (bucket_id = 'logos');

drop policy if exists "logos admin altera" on storage.objects;
create policy "logos admin altera" on storage.objects
  for update to authenticated using (bucket_id = 'logos');

drop policy if exists "logos admin apaga" on storage.objects;
create policy "logos admin apaga" on storage.objects
  for delete to authenticated using (bucket_id = 'logos');
