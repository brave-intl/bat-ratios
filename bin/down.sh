#!/bin/sh
psql $DATABASE_URL --single-transaction -v ON_ERROR_STOP=1 \
  -f ./migrations/0001_pricehistory/down.sql \
  -f ./migrations/0000_initial/down.sql
