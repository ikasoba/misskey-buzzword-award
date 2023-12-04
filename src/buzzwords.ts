import MeCab from "deno_mecab/mod.ts";
import { filterDuplication, getStartOfWeek } from "./utils.ts";
import { tokenizeMfm } from "./tokenize.ts";

export interface WordCounts {
  [k: string]: number;
}

export class BuzzWords {
  constructor(private mecab: MeCab, private db: Deno.Kv) {}

  async measure(text: string) {
    const tokenize = (text: string) =>
      this.mecab
        .parse(text)
        .then((x) =>
          x
            .filter((x) => x.feature === "名詞" && /^\p{L}+$/u.test(x.surface))
            .map((x) => x.surface)
        );

    const words = filterDuplication(await tokenizeMfm(text, tokenize));

    if (words.length == 0) return;

    const week = getStartOfWeek(new Date());
    const counts = await this.db
      .get<WordCounts>([week])
      .then((x) => x.value ?? {});

    console.info("measure:", words);
    for (const word of words) {
      counts[word] = (counts[word] ?? 0) + 1;
    }

    return await this.db.set([week], counts);
  }

  async get(date: Date) {
    const week = getStartOfWeek(date);

    return await this.db.get<WordCounts>([week]).then((x) => x.value);
  }

  async remove(date: Date) {
    const week = getStartOfWeek(date);

    await this.db.delete([week]);
  }
}
