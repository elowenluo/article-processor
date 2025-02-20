import path from "path";

export class ImageService {
  getImagePath(imageName: string): string {
    return path.join(process.cwd(), "images", imageName);
  }
}
