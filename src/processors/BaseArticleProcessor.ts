import { ArticleResponse } from "../types/article";
import { IArticleHandler } from "../interfaces/IArticleHandler";
import { LLMApiConfig } from "../types/article";
import { IFrame } from "sanitize-html";
import { AxiosInstance } from "axios";
import { load } from "cheerio";
import { launch } from "puppeteer";
import { AiService } from "../services/aiService";
import {
  findCategoriesByPattern,
  loadCategoryHierarchy,
  categoriesToString,
  mapCategoriesToIds,
} from "../config/categoryConfig";
import { withRetry } from "../utils/retry";
import sanitize from "sanitize-html";
import axios from "axios";
import sharp from "sharp";
import path from "path";
import https from "https";
import dotenv from "dotenv";
import fs from "fs";

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
    this.needDownloadImages = needDownloadImages || true;

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

    const { content: mainContent, imageUrls } = await this.processImages(
      this.formatHtml(this.parseContent())
    );
    const source = this.parseSource();
    const content = `${mainContent}<footer>自 ${source}</footer>`.replace(
      /\n/g,
      ""
    );

    // 合并调用 LLM，获取标题、摘要、标签、分类
    const meta = await this.generateArticleMeta(mainContent);

    return {
      title: meta.title,
      content,
      summary: meta.summary,
      tags: meta.tags,
      categories: meta.categories,
      categoryIds: meta.categoryIds,
      imageUrls,
      url: this.url,
    };
  }

  abstract parseTitle(): string;
  abstract parseContent(): string;
  abstract parseSource(): string;

  async getHtml(url: string): Promise<string> {
    return withRetry(
      async () => {
        const browser = await launch({ headless: true, args: ['--no-sandbox'] });
        try {
          const page = await browser.newPage();
          await page.goto(url);
          return await page.content();
        } finally {
          await browser.close();
        }
      },
      3,
      2000
    );
  }

  formatHtml(html: string): string {
    let cleanHtml = html.replace(
      "(adsbygoogle = window.adsbygoogle || []).push({});",
      ""
    );

    const $ = load(cleanHtml);
    $("a img").each((_, img) => {
      const $img = $(img);
      const $a = $img.parent("a");

      // Extract the image with its attributes
      $a.replaceWith($img);
    });

    cleanHtml = $.html();

    return sanitize(cleanHtml, {
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
        p: ["style"],
      },
      allowedStyles: {
        p: {
          "text-align": [/left|center|right/],
        },
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

  async processImages(html: string): Promise<{
    content: string;
    imageUrls: string[];
  }> {
    const $ = load(html);
    const images = $("img");
    const imageUrls: string[] = [];

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

      images.each((_, img) => {
        const src = $(img).attr("src");
        if (src) {
          imageUrls.push(src);
        }
      });
    }

    return { content: $.html(), imageUrls: imageUrls };
  }

  async getNewImageSrc(src: string): Promise<string> {
    try {
      const response = await this.axiosInstance.get(src, {
        responseType: "arraybuffer",
      });
      const buffer = response.data;

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

  /**
   * 合并生成标题、摘要、标签、分类，统一调用 LLM，返回结构化 JSON
   */
  async generateArticleMeta(article: string): Promise<{
    title: string;
    summary: string;
    tags: string[];
    categories: string[];
    categoryIds: number[];
  }> {
    if (!this.llmApiConfig) {
      return {
        title: "",
        summary: "",
        tags: [],
        categories: [],
        categoryIds: [],
      };
    }

    // 分类树
    const categoryHierarchy = loadCategoryHierarchy();
    const categoriesString = categoriesToString(categoryHierarchy);

    // 生成分类的 pattern 匹配
    const patternCategories = findCategoriesByPattern(article);

    // 生成 prompt
    const currentYear = new Date().getFullYear();
    
    // 从外部文件加载提示词模板
    let promptTemplate;
    try {
      promptTemplate = fs.readFileSync(
        path.join(process.cwd(), 'src/prompts/article-meta.txt'),
        'utf8'
      );
      console.log("成功加载提示词模板文件");
    } catch (error) {
      console.error("加载提示词模板文件失败:", error);
      // 如果文件加载失败，使用备用的内联模板
      promptTemplate = "你是一个智能文章元数据助手，请生成标题、摘要、标签和分类。当前年份为${currentYear}年。分类：${categoriesString}。Pattern匹配：${patternCategories}。文章内容：${article}";
    }
    
    // 替换模板中的变量
    const prompt = promptTemplate
      .replace(/\${currentYear}/g, currentYear.toString())
      .replace(/\${categoriesString}/g, categoriesString)
      .replace(/\${patternCategories}/g, patternCategories.join(","))
      .replace(/\${article}/g, article);
    
    // 记录提示词的前100个字符，用于调试
    console.log("提示词前100个字符:", prompt.substring(0, 100));

    const response = await aiService.chat(prompt, this.llmApiConfig);

    // 解析 JSON，兼容 LLM 返回的代码块、前后缀等
    let meta: {
      title: string;
      summary: string;
      tags: string[];
      categories: string[];
    } = {
      title: "",
      summary: "",
      tags: [],
      categories: [],
    };

    // 尝试提取 JSON 片段
    function extractJson(str: string): string | null {
      // 匹配 ```json ... ``` 或 ``` ... ``` 代码块
      const codeBlockMatch = str.match(/```(?:json)?\s*([\s\S]+?)\s*```/i);
      if (codeBlockMatch) {
        return codeBlockMatch[1];
      }
      // 匹配第一个 { ... }
      const braceMatch = str.match(/{[\s\S]*}/);
      if (braceMatch) {
        return braceMatch[0];
      }
      return null;
    }

    let jsonStr = extractJson(response);
    if (!jsonStr) {
      jsonStr = response;
    }

    try {
      meta = JSON.parse(jsonStr);
    } catch (e) {
      // 解析失败，记录原始 response 便于排查
      console.error("LLM返回内容无法解析为JSON，原始内容：", response);
    }

    // categories 处理：支持“父#子”路径，拆分为单独分类名
    let allCategoryNames: string[] = [];
    if (Array.isArray(meta.categories)) {
      for (const cat of meta.categories) {
        if (typeof cat === "string") {
          // 拆分“#”路径
          const parts = cat
            .split("#")
            .map((s) => s.trim())
            .filter(Boolean);
          allCategoryNames.push(...parts);
        }
      }
    }
    // 加入 patternCategories，去重
    allCategoryNames.push(...patternCategories);
    const uniqueCategories = extractLeafNames(allCategoryNames);

    // categories 转 categoryIds
    const categoryIds = mapCategoriesToIds(uniqueCategories);

    return {
      title: meta.title || "",
      summary: meta.summary || "",
      tags: meta.tags || [],
      categories: uniqueCategories,
      categoryIds,
    };
  }
}

function filterLeafCategories(categories: string[]) {
  // 首先解析所有分类，建立父子关系映射
  const categoryMap = new Map();
  const allNodes = new Set();

  // 解析每个分类路径
  categories.forEach((category) => {
    const parts = category.split("/");
    allNodes.add(category);

    // 建立父子关系
    for (let i = 0; i < parts.length; i++) {
      const currentPath = parts.slice(0, i + 1).join("/");
      allNodes.add(currentPath);

      if (!categoryMap.has(currentPath)) {
        categoryMap.set(currentPath, {
          fullPath: currentPath,
          children: new Set(),
          isLeaf: true,
        });
      }

      // 如果不是最后一个节点，添加子节点关系
      if (i < parts.length - 1) {
        const childPath = parts.slice(0, i + 2).join("/");
        categoryMap.get(currentPath).children.add(childPath);
        categoryMap.get(currentPath).isLeaf = false;
      }
    }
  });

  // 找出所有叶节点
  const leafNodes = [];
  for (const [path, node] of categoryMap) {
    if (node.isLeaf && categories.includes(path)) {
      leafNodes.push(path);
    }
  }

  // 过滤掉有子节点被选中的父节点
  const result = categories.filter((category) => {
    // 如果是叶节点，保留
    if (categoryMap.get(category)?.isLeaf) {
      return true;
    }

    // 如果是父节点，检查是否有子节点在原始列表中
    const node = categoryMap.get(category);
    if (node) {
      for (const child of node.children) {
        if (categories.includes(child)) {
          return false; // 有子节点被选中，不保留此父节点
        }
      }
    }

    return true;
  });

  return result;
}

function extractLeafNames(categories: string[]) {
  const result = filterLeafCategories(categories);
  return result.map((category) => {
    const parts = category.split("/");
    return parts[parts.length - 1];
  });
}
