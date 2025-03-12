import { ArticleResponse } from "../types/article";
import { CNBetaArticleProcessor } from "../processors/CNBetaArticleProcessor";
import { MyDriversArticleProcessor } from "../processors/MyDriversArticleProcessor";
import { LLMApiConfig } from "../types/article";
import { Job } from "../types/job";
import { globalTaskQueue } from "../utils/rateLimiter";
import { v4 as uuidv4 } from "uuid";

export class ArticleService {
  private jobs: Map<string, Job> = new Map();
  private jobQueue: { id: string; config: LLMApiConfig }[] = []; // Queue of jobs with their configs
  private runningJobCount: number = 0; // Counter for currently running jobs
  private maxConcurrentJobs: number; // Maximum number of jobs that can run concurrently

  constructor(maxConcurrentJobs: number = 1) {
    this.maxConcurrentJobs = maxConcurrentJobs;
    console.log(
      `Article Service initialized with max ${maxConcurrentJobs} concurrent jobs`
    );
  }

  private async processUrls(
    urls: string[],
    llmApiConfig: LLMApiConfig
  ): Promise<ArticleResponse[]> {
    const promises = urls.map((url) =>
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
    this.jobQueue.push({ id, config: llmApiConfig });
    console.log(
      `Job ${id} added to queue. Queue length: ${this.jobQueue.length}`
    );

    if (this.runningJobCount < this.maxConcurrentJobs) {
      this.processNextJob();
    }

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
    } finally {
      // Decrement running jobs counter and try to process the next job
      this.runningJobCount--;
      console.log(
        `Job slot freed. Running: ${this.runningJobCount}/${this.maxConcurrentJobs}. Queued: ${this.jobQueue.length}`
      );
      this.processNextJob();
    }
  }

  private processNextJob() {
    // If at capacity or queue is empty, do nothing
    if (
      this.runningJobCount >= this.maxConcurrentJobs ||
      this.jobQueue.length === 0
    ) {
      return;
    }

    // Get next job from queue
    const nextJob = this.jobQueue.shift();
    if (!nextJob) return;

    this.runningJobCount++;

    // Process the job
    this.processJob(nextJob.id, nextJob.config);
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
