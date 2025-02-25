import { ArticleResponse } from "../types/article";
import { CNBetaArticleProcessor } from "../processors/CNBetaArticleProcessor";
import { MyDriversArticleProcessor } from "../processors/MyDriversArticleProcessor";
import { LLMApiConfig } from "../types/article";
import { globalTaskQueue } from "../utils/rateLimiter";

export class ArticleService {
  async processUrls(
    urls: string[],
    llmApiConfig: LLMApiConfig
  ): Promise<ArticleResponse[]> {
    const promises = urls.map(url =>
      globalTaskQueue.enqueue(() => this.processUrl(url, llmApiConfig))
    );
    const results = await Promise.all(promises);

    return results;
  }

  private async processUrl(
    url: string,
    llmApiConfig: LLMApiConfig
  ): Promise<ArticleResponse> {
    const domain = new URL(url).hostname;
    const processor = this.getProcessor(domain, url, llmApiConfig);
    const article = await processor.processArticle(url);

    return article;
  }

  private getProcessor(
    domain: string,
    url: string,
    llmApiConfig?: LLMApiConfig
  ) {
    switch (domain) {
      case "www.cnbeta.com.tw":
        return new CNBetaArticleProcessor(url, llmApiConfig, true);
      case "news.mydrivers.com":
        return new MyDriversArticleProcessor(url, llmApiConfig);
      default:
        throw new Error(`No processor found for domain: ${domain}`);
    }
  }
}
