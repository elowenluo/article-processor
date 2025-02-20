// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import articleRoutes from "./routes/articleRoute";
import imageRoutes from "./routes/imageRoute";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use("/public", express.static("public"));

// Routes
app.use("/", articleRoutes);
app.use("/", imageRoutes);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

export default app;
