export interface ArticleResponse {
  title: string;
  content: string;
  summary: string;
  tags: string;
  categories: string[];
}

export interface LLMApiConfig {
  model: string;
  apiKey: string;
  url: string;
}
