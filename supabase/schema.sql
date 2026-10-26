-- SC+ Talent & Sports — schéma Supabase
-- À coller dans Supabase > SQL Editor > New query > Run

-- ============ TABLE MEDIAS ============
create table if not exists public.medias (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('image','video')),
  source text not null check (source in ('upload','youtube')),
  titre text not null,
  description text,
  categorie text not null default 'autre',
  url text not null,
  thumb_url text,
  storage_path text,
  publie boolean not null default true,
  ordre int not null default 0
);

alter table public.medias enable row level security;

create policy "public lit les medias publies" on public.medias
  for select to anon using (publie = true);
create policy "admin lit tout" on public.medias
  for select to authenticated using (true);
create policy "admin ajoute" on public.medias
  for insert to authenticated with check (true);
create policy "admin modifie" on public.medias
  for update to authenticated using (true) with check (true);
create policy "admin supprime" on public.medias
  for delete to authenticated using (true);

-- ============ TABLE MESSAGES ============
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nom text not null check (char_length(nom) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  telephone text check (char_length(telephone) <= 40),
  profil text check (char_length(profil) <= 40),
  message text not null check (char_length(message) between 1 and 3000),
  lu boolean not null default false
);

alter table public.messages enable row level security;

create policy "public envoie un message" on public.messages
  for insert to anon with check (lu = false);
create policy "admin lit les messages" on public.messages
  for select to authenticated using (true);
create policy "admin modifie les messages" on public.messages
  for update to authenticated using (true) with check (true);
create policy "admin supprime les messages" on public.messages
  for delete to authenticated using (true);

-- ============ STOCKAGE ============
-- Bucket public en lecture, 50 Mo max par fichier
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medias', 'medias', true, 52428800,
        array['image/webp','image/jpeg','image/png','video/mp4'])
on conflict (id) do nothing;

create policy "admin envoie des fichiers" on storage.objects
  for insert to authenticated with check (bucket_id = 'medias');
create policy "admin modifie des fichiers" on storage.objects
  for update to authenticated using (bucket_id = 'medias');
create policy "admin supprime des fichiers" on storage.objects
  for delete to authenticated using (bucket_id = 'medias');

-- IMPORTANT : dans Authentication > Sign In / Providers, DÉSACTIVER
-- « Allow new users to sign up ». Sinon n'importe qui pourrait créer un compte
-- et devenir « authenticated ».
