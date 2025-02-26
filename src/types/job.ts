import { ArticleResponse } from "./article";

export interface Job {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  urls: string[];
  results?: ArticleResponse[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
