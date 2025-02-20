import { Router } from "express";
import { processArticles } from "../controllers/articleController";

const router = Router();

router.post("/process", processArticles);

export default router;
