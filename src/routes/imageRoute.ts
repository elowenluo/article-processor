import { Router } from "express";
import { downloadImage } from "../controllers/imageController";

const router = Router();

router.get("/downloadImage/:imageName", downloadImage);

export default router;
