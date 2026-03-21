import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./app/routes/routes";
import errorHandler from "./app/middlewares/errorHandler";

dotenv.config();

const app: Application = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "authorization"],
  })
);

app.options("*", cors());

// 10mb to support base64 e-signatures (~5-20KB each)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Borrowers Log API is running." });
});

app.use("/api", router);
app.use(errorHandler);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, statusCode: 404, message: "Route not found." });
});

export default app;