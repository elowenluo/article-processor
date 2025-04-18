export interface ArticleResponse {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  categories: string[];
  categoryIds: number[];
  imageUrls: string[];
}

export interface LLMApiConfig {
  model: string;
  apiKey: string;
  url?: string;
}

export interface Category {
  name: string;
  children: Category[];
  id: number;
}

export interface CategoryPattern {
  category: string;
  pattern: string; 
}