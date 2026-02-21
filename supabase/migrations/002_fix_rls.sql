-- Fix RLS: explicit policies for anon/authenticated + storage

-- Tables: drop old policies and create explicit ones
drop policy if exists "Allow all on documents" on public.documents;
drop policy if exists "Allow all on line_items" on public.line_items;

create policy "documents_all" on public.documents for all to anon, authenticated, service_role
  using (true) with check (true);

create policy "line_items_all" on public.line_items for all to anon, authenticated, service_role
  using (true) with check (true);

-- Storage: allow anon to read/write in receipts bucket (create bucket "receipts" in Dashboard first)
drop policy if exists "receipts_upload" on storage.objects;
drop policy if exists "receipts_read" on storage.objects;
drop policy if exists "receipts_update" on storage.objects;
drop policy if exists "receipts_delete" on storage.objects;

create policy "receipts_upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'receipts');

create policy "receipts_read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'receipts');

create policy "receipts_update" on storage.objects for update to anon, authenticated
  using (bucket_id = 'receipts');

create policy "receipts_delete" on storage.objects for delete to anon, authenticated
  using (bucket_id = 'receipts');
