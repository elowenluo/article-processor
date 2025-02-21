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

export interface Category {
  name: string;
  children: Category[];
}
