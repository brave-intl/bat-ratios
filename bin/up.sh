#!/bin/sh
cat migrations/*/up.sql | psql $DATABASE_URL --single-transaction -v -f ON_ERROR_STOP=1
