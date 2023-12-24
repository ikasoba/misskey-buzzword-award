import { api, Stream, Endpoints } from "misskey-js/";
import { ApiCache } from "./cache.ts";
import { GetMiApiResult } from "./utils.ts";
import * as mfm from "./mfm.ts";
import { BuzzWords } from "./buzzwords.ts";
import { TaskRunner } from "./task.ts";

export class Bot {
  private cache = new ApiCache<{ [K in keyof Endpoints]: GetMiApiResult<K> }>(
    1000 * 60 * 60 * 12
  );
  constructor(
    private task: TaskRunner,
    private buzzWords: BuzzWords,
    private client: api.APIClient,
    private stream: Stream
  ) {}

  async getMeta() {
    const cache = this.cache.get("meta");
    if (cache) return cache;

    const meta = await this.client.request("meta");
    this.cache.set("meta", meta);

    return meta;
  }

  async getMe() {
    const cache = this.cache.get("i");
    if (cache) return cache;

    const me = await this.client.request("i");
    this.cache.set("i", me);

    return me;
  }

  async sendAnnounce() {
    console.log("getMeta");
    const instance = await this.getMeta();
    const dt = new Date();
    dt.setDate(dt.getDate() - 1);

    console.log("get buzzword");
    const counts = await this.buzzWords.get(dt);
    const words = [...counts.entries()]
      .sort(() => 0.5 - Math.random())
      .sort(([_, x], [__, y]) => y - x)
      .slice(0, 10);

    console.log("send announce", counts, words);
    await this.client.request("notes/create", {
      visibility: "home",
      text: [
        mfm.center(
          mfm.sparkle(
            mfm.font(`～ ${instance.name!} 週間流行語大賞 ～`, "serif")
          )
        ),
        mfm.x2(" "),
        words.length == 0
          ? "今週の流行語はひとつもありませんでした。"
          : words.map((w, i) => `第${i + 1}位「${w[0]}」`).join("\n\n"),
        "\n\nまた来週。",
      ].join("\n"),
    });

    console.log("remove buzzword");
    await this.buzzWords.remove(dt);
  }

  start() {
    Deno.cron("announce", "0 0 * * SUN", () => {
      this.task.run(async () => {
        await this.sendAnnounce();
      });
    });

    this.stream.useChannel("homeTimeline").addListener("note", async (note) => {
      const me = await this.getMe();

      if (note.text === "!test-buzzword-award-announce") {
        await this.sendAnnounce();
      } else if (note.text && note.userId !== me.id && !note.user.instance) {
        try {
          await this.buzzWords.measure(note.text).catch((e) => {
            throw e;
          });
        } catch (e) {
          console.error(e);
        }
      }
    });
  }
}
