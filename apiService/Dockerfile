FROM node:16

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn generate

COPY . .

RUN yarn build

COPY . .

CMD ["yarn", "start"]
