import { ArticleResponse } from "../types/article";
import { IArticleHandler } from "../interfaces/IArticleHandler";
import { IFrame } from "sanitize-html";
import { AxiosInstance } from "axios";
import { load } from "cheerio";
import { launch } from "puppeteer";
import sanitize from "sanitize-html";
import axios from "axios";
import sharp from "sharp";
import path from "path";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "http://localhost";

export abstract class BaseArticleProcessor implements IArticleHandler {
  protected url: string;
  protected $!: cheerio.Root;
  protected html!: string;
  protected needDownloadImages!: boolean;
  protected axiosInstance: AxiosInstance;

  constructor(url: string, needDownloadImages?: boolean) {
    this.url = url;
    this.needDownloadImages = needDownloadImages || false;

    // 创建配置了 SSL 验证选项的 axios 实例
    this.axiosInstance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // 允许自签名证书
      }),
      timeout: 10000, // 10 秒超时
      maxContentLength: 20 * 1024 * 1024, // 20MB 最大下载限制
    });
  }

  async processArticle(url: string): Promise<ArticleResponse> {
    this.url = url;
    this.html = await this.getHtml(url);
    this.$ = load(this.html);

    const title = this.parseTitle();
    const mainContent = await this.processImages(
      this.formatHtml(this.parseContent())
    );
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

  async processImages(html: string): Promise<string> {
    const $ = load(html);
    const images = $("img");

    // center the images
    images.each((_, img) => {
      $(img).wrap("<figure></figure>");
      $(img).parent().css("text-align", "center");
    });

    // download images
    if (this.needDownloadImages) {
      const imagePromises = images.map(async (_, img) => {
        const src = $(img).attr("src");
        if (!src) {
          return;
        }
        try {
          const newSrc = await this.getNewImageSrc(src);
          $(img).attr("src", newSrc);
        } catch (error) {
          console.error(`Failed to process image ${src}:`, error);
        }
      });

      await Promise.all(imagePromises);
    }

    return $("body").html() ?? "";
  }

  async getNewImageSrc(src: string): Promise<string> {
    try {
      const response = await this.axiosInstance.get(src, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(response.data, "binary");

      const imageName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;

      const image = sharp(buffer);
      const metaData = await image.metadata();

      let finalImageName: string;

      if (metaData.format === "webp") {
        finalImageName = `${imageName}.jpeg`;

        await image
          .jpeg()
          .toFile(path.join(process.cwd(), "images", finalImageName));
      } else {
        const ext = metaData.format || "jpeg";
        finalImageName = `${imageName}.${ext}`;

        await image.toFile(path.join(process.cwd(), "images", finalImageName));
      }

      return `${HOST}:${PORT}/downloadImage/${finalImageName}`;
    } catch (error) {
      console.error(`Failed to download image from ${src}: ${error}`);
      return src;
    }
  }
}
