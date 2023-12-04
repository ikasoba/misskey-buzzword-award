import mfm from "mfm-js/";

export async function tokenizeMfm(
  text: string,
  tokenize: (text: string) => Promise<string[]> | string[]
): Promise<string[]> {
  const processMfm = async (tree: mfm.MfmNode): Promise<string[]> => {
    switch (tree.type) {
      case "text":
        return await tokenize(tree.props.text);

      case "link":
      case "url":
        return [];

      case "hashtag":
        return [tree.props.hashtag];

      case "unicodeEmoji":
        return [tree.props.emoji];

      case "strike":
      case "small":
      case "quote":
      case "plain":
      case "center":
        return (
          await Promise.all(tree.children.map((x) => processMfm(x)))
        ).flat();

      case "fn":
        return (
          await Promise.all(tree.children.map((x) => processMfm(x)))
        ).flat();

      case "search":
        return await tokenize(tree.props.content);

      case "mention":
        return [];

      case "mathInline":
      case "mathBlock":
      case "inlineCode":
      case "blockCode":
        return [];

      case "emojiCode":
        return [":" + tree.props.name + ":"];

      case "bold":
        return (
          await Promise.all(tree.children.map((x) => processMfm(x)))
        ).flat();

      case "italic":
        return (
          await Promise.all(tree.children.map((x) => processMfm(x)))
        ).flat();

      default:
        return [];
    }
  };

  return (await Promise.all(mfm.parse(text).map((x) => processMfm(x)))).flat();
}
