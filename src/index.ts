import dotenv from "dotenv";
import app from "./app";
import { CleanupTools } from "./utils/cleanupTools";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "http://localhost";
const TIMEOUT = process.env.TIMEOUT || 300000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `Image download endpoint: ${HOST}:${PORT}/downloadImage/:imageName`
  );
  console.log(`Article processing endpoint:  ${HOST}:${PORT}/process`);
});

server.timeout = Number(TIMEOUT);

// Schedule cleanup tasks
const cleanupTools = new CleanupTools(1);
cleanupTools.scheduleCleanupTasks(12);
