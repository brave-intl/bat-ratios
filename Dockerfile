FROM node:14.17-alpine

RUN apk update
RUN apk add yarn python g++ make postgresql postgresql-contrib
RUN rm -rf /var/cache/apk/*

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY yarn.lock /usr/src/app/
# because of a bug where postinstall is not run for yarn
RUN yarn
RUN yarn run postinstall
COPY . /usr/src/app/

CMD yarn start
