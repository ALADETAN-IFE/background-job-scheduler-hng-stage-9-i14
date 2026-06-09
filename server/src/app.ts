import express from "express";
import router from "./routes";
import cors from "cors";
import { ENV } from "@/config";
import morgan from "morgan";

const app = express();

// Parse JSON request bodies
app.use(express.json());

const corsOptions = {
  origin: ENV.ALLOWED_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(morgan("dev"));

// Connect routes
app.use(router);

export default app;
