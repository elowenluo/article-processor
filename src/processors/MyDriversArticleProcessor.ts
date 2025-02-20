import { BaseArticleProcessor } from "./BaseArticleProcessor";

export class MyDriversArticleProcessor extends BaseArticleProcessor {
  parseTitle(): string {
    return this.$("#thread_subject").text();
  }

  parseContent(): string {
    const $content = this.$(".news_info");

    // delete the latest <div></div> tag which contains the source
    $content.find("div").last().remove();

    // replace the first paragraph with "近日消息"
    const $firstParagraph = $content.find("p").first();
    let text = $firstParagraph.html() || "";
    text = text
      .replace(
        /(快科技)?\s*\d+\s*月\s*\d+\s*日\s*(消息|讯|报道|获悉)?/g,
        "近日消息"
      )
      .replace(/^\s*\d+\s*月\s*\d+\s*日\s*/g, "近日消息，")
      .replace(/近日消息[，,]\s*近日消息[，,]?/g, "近日消息，")
      .replace(/近日消息(?![，,])/g, "近日消息，");
    $firstParagraph.html(text);

    // add "https" to the image src
    $content.find("img").each((_, img) => {
      const $img = this.$(img);
      const src = $img.attr("src") || "";
      if (src.startsWith("//")) {
        $img.attr("src", `https:${src}`);
      }
    });

    const content = $content.html() || "";
    return content;
  }

  parseSource(): string {
    const match = this.$(".news_bt1_left")
      .text()
      .match(/(?<=出处：)\S+/);
    const source = match ? match[0] : "快科技";

    return source;
  }
}
