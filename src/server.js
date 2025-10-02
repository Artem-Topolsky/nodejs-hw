import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { connectMongoDB } from "./db/connectMongoDB.js";
import { logger } from "./middleware/logger.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";

import notesRoutes from "./routes/notesRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(logger);

app.use(notesRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  await connectMongoDB();
  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server is running on port ${process.env.PORT}`);
  });
};

startServer();
