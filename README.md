# bat-ratios

Server for ratios between fiats and alts

## setup

```sh
git pull git@github.com:brave-intl/bat-ratios.git
yarn install
```

## start

```sh
yarn start
```

## test

```sh
yarn test
```

## development
```sh
yarn run dev
```

to access the documentation visit `/v1/documentation/`

## Postgres

After running
```bash
yarn run docker-migrate-up
```
login to the db with
```bash
psql postgres://ratios:password@localhost:4010/ratios
```
