import MeCab from "deno_mecab/src/MeCab.ts";
import { Bot } from "./src/bot.ts";
import { BuzzWords } from "./src/buzzwords.ts";
import { TaskRunner } from "./src/task.ts";
import { Stream, api } from "misskey-js/";

const buzzWords = new BuzzWords(
  new MeCab([Deno.env.get("MECAB")!]),
  await Deno.openKv("./db/counts"),
  await Deno.openKv("./db/scores"),
  await Deno.openKv("./db/meta")
);

const tasks = new TaskRunner();

const client = new api.APIClient({
  origin: Deno.env.get("MISSKEY_API")!,
  credential: Deno.env.get("TOKEN")!,
});

const stream = new Stream(Deno.env.get("MISSKEY_STREAM")!, {
  token: client.credential!,
});

const bot = new Bot(tasks, buzzWords, client, stream);

tasks.start();

bot.start();
