# bat-ratios

Server for ratios between fiats and alts

## setup

```sh
git pull git@github.com:brave-intl/bat-ratios.git
npm install
```

## start

```sh
npm start
```

## test

```sh
npm test
```

## development
```sh
npm run dev
```

to access the documentation visit `/v1/documentation/`

## Postgres

After running
```bash
npm run docker-migrate-up
```
login to the db with
```bash
psql postgres://ratios:password@localhost:4010/ratios
```