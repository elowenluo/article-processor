import dotenv from "dotenv";
import app from "./app";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "http://localhost";

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Image download endpoint: ${HOST}:${PORT}/downloadImage/:imageName`);
  console.log(`Article processing endpoint:  ${HOST}:${PORT}/process`);
});
