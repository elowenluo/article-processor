import { BaseArticleProcessor } from "./BaseArticleProcessor";

export class CNBetaArticleProcessor extends BaseArticleProcessor {
  parseTitle(): string {
    return this.$("h1").text();
  }

  parseContent(): string {
    const $content = this.$("#artibody");
    const $summary = this.$(".article-summary > p");
    const content = `${$summary.html()}${$content.html()}`;
    return content;
  }

  parseSource(): string {
    const source = this.$(".source").text().replace("稿源：", "");

    if (source === "cnBeta.COM") {
      return "中文业界资讯站";
    }

    return source;
  }
}
