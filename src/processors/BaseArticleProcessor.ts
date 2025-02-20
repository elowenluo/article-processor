import { ArticleResponse } from "../types/article";
import { IArticleHandler } from "../interfaces/IArticleHandler";
import { LLMApiConfig } from "../types/article";
import { IFrame } from "sanitize-html";
import { AxiosInstance } from "axios";
import { load } from "cheerio";
import { launch } from "puppeteer";
import { AiService } from "../services/aiService";
import sanitize from "sanitize-html";
import axios from "axios";
import sharp from "sharp";
import path from "path";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "http://localhost";

const aiService = new AiService();

export abstract class BaseArticleProcessor implements IArticleHandler {
  protected url: string;
  protected axiosInstance: AxiosInstance;
  protected needDownloadImages: boolean;
  protected llmApiConfig?: LLMApiConfig;
  protected $!: cheerio.Root;
  protected html!: string;

  constructor(
    url: string,
    llmApiConfig?: LLMApiConfig,
    needDownloadImages?: boolean
  ) {
    this.url = url;
    this.needDownloadImages = needDownloadImages || false;

    if (llmApiConfig) {
      this.llmApiConfig = llmApiConfig;
    }

    this.axiosInstance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
      timeout: 10000,
      maxContentLength: 20 * 1024 * 1024,
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

    let tags: string[] = [];
    let summary = "";
    let categories: string[] = [];

    if (this.llmApiConfig) {
      summary = await this.generateSummary(mainContent);
      tags = await this.generateTags(mainContent);
      //  categories = await this.generateCategories();
    }

    return {
      title,
      content,
      summary,
      tags: tags.join("、"),
      categories,
    };
  }

  abstract parseTitle(): string;
  abstract parseContent(): string;
  abstract parseSource(): string;

  // TODO Implement the following methods
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

  async generateTags(article: string): Promise<string[]> {
    const prompt = `你是文章标签分析助手，请按以下规则生成标签：
                    数量规则：
                    - 短文(<1000字): 3-5个
                    - 中长文(1000-3000字): 4-6个 
                    - 长文(>3000字): 5-8个

                    排序规则：
                    1. 首位为核心主题标签
                    2. 次位为主要领域标签
                    3. 后续按相关度排序

                    标签要求：
                    - 使用热门、常用、读者熟悉的标签
                    - 禁用过于宽泛、过长(>10字)、重复、生僻术语的标签
                    - 中文加#号
                    - 避免特殊字符(下划线除外)

                    示例：
                    文章:《MacBook Pro M3评测》
                    标签: #MacBookPro #M3芯片 #苹果笔记本 #科技评测 #性能测试

                    请直接返回标签序列,不要包含任何其他文字、符号或说明。`;

    if (!this.llmApiConfig) {
      throw new Error("LLM API config not provided");
    }

    const response = await aiService.chat(
      `${prompt}---${article}`,
      this.llmApiConfig
    );

    return response
      .split("#")
      .map(tag => tag.trim())
      .filter(tag => tag !== "");
  }

  async generateSummary(article: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prompt = `请你总结这篇文章，要求：
                    1.字数严格控制在 100-120 字；
                    2.重点利用文章中的数据，使其更有说服力；
                    3.不要使用吸引眼球的夸张语法，理性叙事总结；
                    4.如果有，请注明这篇文章的来源、研究团队等，并将其放置于摘要的开头；
                    5.不要出现“这篇文章”等字眼；
                    6.不用加“摘要：”、“文章摘要：等词语，直接返回摘要，无需提示其为摘要”；
                    7.不要出现文章未提及的内容及数据;
                    8.如果没有明确指出，当前年份为${currentYear}年。`;

    if (!this.llmApiConfig) {
      throw new Error("LLM API config not provided");
    }

    const response = await aiService.chat(
      `${prompt}---${article}`,
      this.llmApiConfig
    );

    return response;
  }
}
