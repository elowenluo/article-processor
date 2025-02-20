import { ArticleResponse } from "../types/article";

export interface IArticleHandler {
  processArticle(url: string): Promise<ArticleResponse>;
  parseTitle(): string;
  parseContent(): string;
  parseSource(): string;
}
