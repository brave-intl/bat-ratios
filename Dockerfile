FROM node:14.15-alpine

RUN apk update
RUN apk add yarn python g++ make postgresql postgresql-contrib
RUN rm -rf /var/cache/apk/*

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY yarn.lock /usr/src/app/
RUN yarn
COPY . /usr/src/app/

CMD yarn start
