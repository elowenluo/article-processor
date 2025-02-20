// src/index.ts
import dotenv from 'dotenv';
import app from './app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Image download endpoint: http://localhost:${PORT}/download/:imageName`);
  console.log(`Article processing endpoint: http://localhost:${PORT}/process`);
});