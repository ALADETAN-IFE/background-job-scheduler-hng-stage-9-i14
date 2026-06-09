import express from "express";
import router from "./routes";
import { errorHandler, observabilityMiddleware } from "@/middlewares";
import cors from "cors";
import { ENV } from "@/config";
import morgan from "morgan";

const app = express();

// Enable trust proxy for reverse proxy
app.set("trust proxy", 1);

// Parse JSON request bodies
app.use(express.json());

app.use(observabilityMiddleware);

const corsOptions = {
  origin: ENV.ALLOWED_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(morgan("dev"));

// Connect routes
app.use(router);

app.use(errorHandler);

export default app;
