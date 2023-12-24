import MeCab from "deno_mecab/mod.ts";
import { filterDuplication, getStartOfWeek } from "./utils.ts";
import { tokenizeMfm } from "./tokenize.ts";

export interface WordCounts {
  [k: string]: number;
}

export class BuzzWords {
  constructor(
    private mecab: MeCab,
    private countDb: Deno.Kv,
    private scoreDb: Deno.Kv,
    private metaDb: Deno.Kv
  ) {}

  async measure(text: string) {
    const tokenize = (text: string) =>
      this.mecab
        .parse(text)
        .then((x) =>
          x
            .filter(
              (x) =>
                x.feature === "名詞" &&
                /^\p{L}+$/u.test(x.surface) &&
                x.surface.length >= 3
            )
            .map((x) => x.surface)
        );

    // 最大300単語まで処理する
    const splittedText = (await tokenizeMfm(text, tokenize)).slice(0, 300);
    const words = filterDuplication(splittedText);
    if (words.length == 0) return;

    const week = getStartOfWeek(new Date());

    // 文章中の単語の出現頻度
    const frequencies = splittedText.reduce(
      (p, c) => p.set(c, (p.get(c) ?? 0) + 1),
      new Map<string, number>()
    );
    const totalFrequency = [...frequencies.values()].reduce((p, c) => p + c, 0);

    // これまで計測した文章の数
    const totalNotes = await this.metaDb
      .get<number>([week, ":meta:", ":totalNotes:"])
      .then<number>((x) => x.value ?? 0);

    // これまで計測した単語の出現頻度
    const counts = await this.countDb
      .getMany<number[]>(words.map((w) => [week, w]))
      .then((x) =>
        x.reduce(
          (p, c) => p.set(c.key[1].toString(), c.value ?? 0),
          new Map<string, number>()
        )
      );

    // スコアのテーブル
    const scores = await this.scoreDb
      .getMany<number[]>(words.map((w) => [week, w]))
      .then((x) =>
        x.reduce(
          (p, c) => p.set(c.key[1].toString(), c.value ?? 0),
          new Map<string, number>()
        )
      );

    console.info("measure:", words);
    for (const word of words) {
      const tf = (frequencies.get(word) ?? 0) / totalFrequency;
      const idf = Math.log(totalNotes / (counts.get(word) ?? 0));

      scores.set(word, (scores.get(word) ?? 0) + tf * idf);
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }

    await this.metaDb.set([week, ":meta:", ":totalNotes:"], totalNotes + 1);

    for (const [w, v] of scores) {
      await this.scoreDb.set([week, w], v);
    }

    for (const [w, v] of counts) {
      await this.countDb.set([week, w], v);
    }

    return;
  }

  async get(date: Date) {
    const week = getStartOfWeek(date);

    const scores = new Map<string, number>();
    for await (const item of this.scoreDb.list<number>({ prefix: [week] })) {
      scores.set(item.key[1].toString(), item.value ?? 0);
    }

    return scores;
  }

  async remove(date: Date) {
    const week = getStartOfWeek(date);

    await this.metaDb.delete([week, ":meta:", ":totalNotes:"]);

    for await (const item of this.countDb.list({ prefix: [week] })) {
      await this.countDb.delete(item.key);
    }

    for await (const item of this.scoreDb.list({ prefix: [week] })) {
      await this.scoreDb.delete(item.key);
    }
  }
}
