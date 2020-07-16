FROM node:10.15.3

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y postgresql-client

COPY . /usr/src/app
RUN ["chmod", "+x", "/usr/src/app/bin/up.sh"]
RUN ["chmod", "+x", "/usr/src/app/bin/down.sh"]
RUN npm i

CMD npm start
