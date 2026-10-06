FROM node:lts-bookworm

RUN apt-get update && \
  apt-get upgrade -y && \
  apt-get install -y ffmpeg && \
  rm -rf /var/lib/apt/lists/*

COPY package.json .

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
