alter table public.deals
add column if not exists item_fee numeric not null default 0;

comment on column public.deals.item_fee is 'Harga barang yang dititip/belanjakan, terpisah dari agreed_fee yang menyimpan ongkos jastip.';
