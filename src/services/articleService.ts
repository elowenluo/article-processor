import { ArticleResponse } from "../types/article";
import { CNBetaArticleProcessor } from "../processors/CNBetaArticleProcessor";
import { MyDriversArticleProcessor } from "../processors/MyDriversArticleProcessor";
import { LLMApiConfig } from "../types/article";
import { Job } from "../types/job";
import { globalTaskQueue } from "../utils/rateLimiter";
import { v4 as uuidv4 } from "uuid";

export class ArticleService {
  private jobs: Map<string, Job> = new Map();

  private async processUrls(
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
    console.log(`Processing URL: ${url}`);
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

  createJob(urls: string[], llmApiConfig: LLMApiConfig): Job {
    const id = uuidv4();
    const job: Job = {
      id,
      status: "pending",
      urls,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(id, job);

    this.processJob(id, llmApiConfig);

    return job;
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  private async processJob(id: string, llmApiConfig: LLMApiConfig) {
    try {
      const job = this.jobs.get(id);
      if (!job) return;

      job.status = "processing";
      job.updatedAt = new Date();
      this.jobs.set(id, job);

      const results = await this.processUrls(job.urls, llmApiConfig);

      job.results = results;
      job.status = "completed";
      job.updatedAt = new Date();
      this.jobs.set(id, job);

      setTimeout(() => {
        this.jobs.delete(id);
      }, 1000 * 60 * 60 * 24); // 1 day
    } catch (error) {
      const job = this.jobs.get(id);
      if (!job) return;

      job.status = "failed";
      job.error = error instanceof Error ? error.message : String(error);
      job.updatedAt = new Date();
      this.jobs.set(id, job);
      console.error(`Error processing job ${id}:`, error);
    }
  }

  cleanupOldJobs(maxAgeHours = 24): void {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    for (const [id, job] of this.jobs.entries()) {
      if (job.createdAt < cutoffTime) {
        this.jobs.delete(id);
      }
    }
  }
}
