-- Rode isto no Supabase: SQL Editor > New query > Run

create table if not exists public.cartas (
  id              bigint generated always as identity primary key,
  codigo          text not null,
  cota            text,
  categoria       text not null check (categoria in ('imovel', 'veiculo')),
  credito         numeric(12,2) not null default 0,
  entrada         numeric(12,2) not null default 0,
  parcelas        integer not null default 0,
  valor_parcela   numeric(12,2) not null default 0,
  saldo_devedor   numeric(12,2) not null default 0,
  administradora  text,
  grupo           text,
  status          text not null default 'disponivel' check (status in ('disponivel', 'reservada', 'vendida')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Segurança: qualquer visitante só LÊ (e não vê as vendidas);
-- só usuário logado (o admin) pode criar, editar e excluir.
alter table public.cartas enable row level security;

drop policy if exists "publico le cartas" on public.cartas;
create policy "publico le cartas" on public.cartas
  for select to anon
  using (status <> 'vendida');

drop policy if exists "admin le tudo" on public.cartas;
create policy "admin le tudo" on public.cartas
  for select to authenticated
  using (true);

drop policy if exists "admin escreve" on public.cartas;
create policy "admin escreve" on public.cartas
  for all to authenticated
  using (true) with check (true);

-- Atualiza updated_at automaticamente
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_cartas_updated on public.cartas;
create trigger trg_cartas_updated before update on public.cartas
  for each row execute function public.set_updated_at();
