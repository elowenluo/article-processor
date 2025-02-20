import { Request, Response } from "express";
import { ImageService } from "../services/imageService";

const imageService = new ImageService();

export const downloadImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { imageName } = req.params;

    if (!imageName) {
      res.status(400).json({ error: "Image name must be provided" });
    }

    res.download(imageService.getImagePath(imageName));
  } catch (error) {
    console.error("Error downloading image:", error);
    res.status(500).json({ error: "Failed to download image" });
  }
};
