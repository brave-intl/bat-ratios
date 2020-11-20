#!/bin/sh
psql $DATABASE_URL --single-transaction -v -f ON_ERROR_STOP=1 $@
