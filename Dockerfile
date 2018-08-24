FROM node:8

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install -g npm@6.1
COPY package.json package-lock.json /usr/src/app/

RUN npm install --production
COPY . /usr/src/app
EXPOSE 8000
CMD ["npm start"]
