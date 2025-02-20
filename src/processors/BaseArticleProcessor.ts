import { ArticleResponse } from "../types/article";
import { IArticleHandler } from "../interfaces/IArticleHandler";
import { IFrame } from "sanitize-html";
import { load } from "cheerio";
import { launch } from "puppeteer";
import sanitize from "sanitize-html";

export abstract class BaseArticleProcessor implements IArticleHandler {
  protected url: string;
  protected $!: cheerio.Root;
  protected html!: string;

  constructor(url: string) {
    this.url = url;
  }

  async processArticle(url: string): Promise<ArticleResponse> {
    this.url = url;
    this.html = await this.getHtml(url);
    this.$ = load(this.html);

    const title = this.parseTitle();
    const mainContent = this.formatHtml(this.parseContent());
    const source = this.parseSource();
    const content =
      `<article>${mainContent}<footer>自 ${source}</footer></article>`.replace(
        /\n/g,
        ""
      );
    // const summary = await this.generateSummary();
    // const tags = await this.generateTags();
    // const categories = await this.generateCategories();
    const summary = "";
    const tags: string[] = [];
    const categories: string[] = [];

    return {
      title,
      content,
      summary,
      tags: tags.join(","),
      categories,
    };
  }

  abstract parseTitle(): string;
  abstract parseContent(): string;
  abstract parseSource(): string;

  // TODO Implement the following methods
  // abstract generateSummary(): Promise<string>;
  // abstract generateTags(): Promise<string[]>;
  // abstract generateCategories(): Promise<string[]>;

  async getHtml(url: string): Promise<string> {
    try {
      const browser = await launch();
      const page = await browser.newPage();
      await page.goto(url);

      const html = await page.content();

      if (!html || html.trim() === "") {
        throw new Error("No HTML content found");
      }

      await browser.close();
      return html;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch HTML from ${url}: ${error.message}`);
      } else {
        throw new Error(`Failed to fetch HTML from ${url}`);
      }
    }
  }

  formatHtml(html: string): string {
    return sanitize(html, {
      allowedTags: [
        "article",
        "section",
        "p",
        "div",
        "span",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "blockquote",
        "img",
        "figure",
        "figcaption",
        "strong",
        "em",
        "br",
        "footer",
      ],
      allowedAttributes: {
        img: ["src", "alt"],
      },
      nonTextTags: ["img", "br"],
      // Delete all tags that do not contain text
      exclusiveFilter: function (frame: IFrame) {
        if (["img", "br"].includes(frame.tag)) {
          return false;
        }
        return frame.text.trim() === "" && !frame.mediaChildren.length;
      },
    });
  }
}
