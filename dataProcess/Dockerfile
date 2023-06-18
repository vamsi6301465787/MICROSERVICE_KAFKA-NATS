FROM node:16.11

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

COPY . .

CMD ["yarn", "start"]
