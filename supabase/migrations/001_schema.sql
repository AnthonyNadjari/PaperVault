-- PaperVault: documents + line_items, full-text search, storage ready

-- Documents (receipts, invoices, warranties)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'receipt' check (type in ('receipt', 'invoice', 'warranty', 'other')),
  merchant_name text not null default '',
  date date,
  total_amount text not null default '',
  currency text not null default '',
  category text not null default '',
  comment text not null default '',
  warranty_enabled boolean not null default false,
  warranty_end_date date,
  warranty_duration text not null default '',
  warranty_product_description text not null default '',
  raw_ocr_text text not null default '',
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Line items per document
create table if not exists public.line_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  description text not null default '',
  quantity text not null default '1',
  price text not null default '',
  position int not null default 0
);

-- Full-text search on documents
alter table public.documents add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(merchant_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(comment, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(raw_ocr_text, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(total_amount, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'B')
  ) stored;

create index if not exists documents_search_idx on public.documents using gin(search_vector);
create index if not exists documents_date_idx on public.documents(date desc);
create index if not exists documents_created_at_idx on public.documents(created_at desc);
create index if not exists line_items_document_id_idx on public.line_items(document_id);

-- Full-text search on line_items descriptions (for "HDMI" etc.)
create index if not exists line_items_description_gin on public.line_items using gin(to_tsvector('simple', description));

-- RLS: allow all for now (single-user / add auth later)
alter table public.documents enable row level security;
alter table public.line_items enable row level security;

create policy "Allow all on documents" on public.documents for all using (true) with check (true);
create policy "Allow all on line_items" on public.line_items for all using (true) with check (true);

-- Storage bucket for receipt images (create in Dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false);
