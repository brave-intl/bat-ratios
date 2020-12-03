FROM node:14.15-alpine

RUN apk update
RUN apk add yarn python g++ make postgresql postgresql-contrib
RUN rm -rf /var/cache/apk/*

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
RUN yarn

CMD yarn start
