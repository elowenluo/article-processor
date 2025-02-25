import fs from "fs";
import path from "path";

export class CleanupTools {
  private imageDirPath: string;
  private imageRetentionDays: number;

  constructor(
    imageRetentionDays: number = 7,
    imageDirPath: string = path.join(process.cwd(), "images"),
  ) {
    this.imageDirPath = imageDirPath;
    this.imageRetentionDays = imageRetentionDays;

    if (!fs.existsSync(this.imageDirPath)) {
      fs.mkdirSync(this.imageDirPath);
    }
  }

  public cleanupOldImages(): void {
    try {
      console.log(
        `Cleaning up images older than ${this.imageRetentionDays} days...`
      );

      const cutoffTime =
        Date.now() - this.imageRetentionDays * 24 * 60 * 60 * 1000;
      const files = fs.readdirSync(this.imageDirPath);

      files.forEach(file => {
        const filePath = path.join(this.imageDirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old image: ${file}`);
        }
      });
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  public scheduleCleanupTasks(intervalHours: number = 24): void {
    this.cleanupOldImages();

    setInterval(() => {
      this.cleanupOldImages();
    }, intervalHours * 60 * 60 * 1000);
  }
}
