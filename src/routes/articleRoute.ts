import { Router } from "express";
import {
  processArticles,
  getJobStatus,
} from "../controllers/articleController";

const router = Router();

router.post("/process", processArticles);
router.get("/processStatus/:jobId", getJobStatus);

export default router;
