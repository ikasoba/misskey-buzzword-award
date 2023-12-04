FROM denoland/deno:1.38.4

RUN apt update
RUN apt install -y mecab mecab-ipadic-utf8

WORKDIR /app
COPY . .
RUN deno cache main.ts

CMD deno run -A --unstable main.ts