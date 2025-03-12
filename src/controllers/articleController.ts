import { Request, Response } from "express";
import { ArticleService } from "../services/articleService";

// Get max concurrent jobs from environment variables or default to 1
const MAX_CONCURRENT_JOBS = process.env.MAX_CONCURRENT_JOBS
  ? parseInt(process.env.MAX_CONCURRENT_JOBS)
  : 1;

const articleService = new ArticleService(MAX_CONCURRENT_JOBS);

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

    const job = articleService.createJob(urls, llmApiConfig);

    res.status(202).json({
      jobId: job.id,
      status: job.status,
      message: "Processing started. Check status at the URL below.",
      statusUrl: `/processStatus/${job.id}`,
    });
  } catch (error) {
    console.error("Error processing articles:", error);
    res.status(500).json({ error: "Failed to process articles" });
  }
};

export const getJobStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const job = articleService.getJob(jobId);

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    if (job.status === "completed") {
      res.status(200).json(job.results);
    } else if (job.status === "failed") {
      res.status(422).json({
        jobId: job.id,
        status: job.status,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      });
    } else {
      res.status(202).json({
        jobId: job.id,
        status: job.status,
        message: "Job is still processing",
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      });
    }
  } catch (error) {
    console.error("Error fetching job status:", error);
    res.status(500).json({ error: "Failed to fetch job status" });
  }
};
