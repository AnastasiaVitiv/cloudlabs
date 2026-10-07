FROM node:22.23.3-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

USER node

EXPOSE 3005

CMD ["node", "server.js"]
