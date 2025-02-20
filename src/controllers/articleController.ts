import { Request, Response } from "express";
import { ArticleService } from "../services/articleService";

const articleService = new ArticleService();

export const processArticles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { urls, llmApiConfig } = req.body;

    if (!Array.isArray(urls)) {
      res.status(400).json({ error: "URLs must be provided as an array" });
      return;
    }

    const results = await articleService.processUrls(urls, llmApiConfig);
    res.json(results);
  } catch (error) {
    console.error("Error processing articles:", error);
    res.status(500).json({ error: "Failed to process articles" });
  }
};
