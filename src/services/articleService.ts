import { ArticleResponse } from "../types/article";
import { CNBetaArticleProcessor } from "../processors/CNBetaArticleProcessor";
import { MyDriversArticleProcessor } from "../processors/MyDriversArticleProcessor";

export class ArticleService {
  async processUrls(urls: string[]): Promise<ArticleResponse[]> {
    const results = await Promise.all(
      urls.map(async url => this.processUrl(url))
    );

    return results;
  }

  private async processUrl(url: string): Promise<ArticleResponse> {
    const domain = new URL(url).hostname;
    const processor = this.getProcessor(domain, url);
    const article = await processor.processArticle(url);

    return article;
  }

  private getProcessor(domain: string, url: string) {
    switch (domain) {
      case "www.cnbeta.com.tw":
        return new CNBetaArticleProcessor(url, true);
      case "news.mydrivers.com":
        return new MyDriversArticleProcessor(url);
      default:
        throw new Error(`No processor found for domain: ${domain}`);
    }
  }
}
