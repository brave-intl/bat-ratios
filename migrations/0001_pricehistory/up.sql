select execute($$

insert into migrations (id, description) values ('0001', 'pricehistory');

create table pricehistory(
  id uuid primary key,
  created_at timestamp with time zone not null default current_timestamp,
  updated_at timestamp with time zone not null default current_timestamp,

  truncated_date timestamp with time zone not null,
  prices jsonb not null
);

$$) where not exists (select * from migrations where id = '0001');
