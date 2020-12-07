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

before anything else you must do the following steps
```sh
yarn run docker-build # build the containers
yarn run docker-up-dbs # bring the dbs up
yarn run docker-migrate-dbs # migrate the dbs
yarn run docker-fill-dbs # fill the dbs with data
# optionally
yarn run docker-up # brings server up
```


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
