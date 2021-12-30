select execute($$

insert into migrations (id, description) values ('0002', 'coingecko_usage');

create table coingecko_usage(
  ymd               date not null,
  ymdhm             timestamp not null,
  hour              integer not null,
  total             integer not null,
  token             varchar(200) not null,
  endpoint          varchar(100) not null,
  currency          varchar(150) not null,
  token_currency    varchar(200) not null,
  PRIMARY KEY (ymdhm, ymd, hour, endpoint, token_currency, token, currency)
);

$$) where not exists (select * from migrations where id = '0002');
