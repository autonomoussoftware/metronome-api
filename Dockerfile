FROM node:8

WORKDIR /usr/src/api
COPY package.json .
COPY package-lock.json .
COPY patches patches
RUN npm install --unsafe-perm
COPY . .

CMD ["npm", "start"]

EXPOSE 3002
