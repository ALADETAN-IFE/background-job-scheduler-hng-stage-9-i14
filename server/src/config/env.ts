import dotenv from "dotenv";
dotenv.config();

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
};

function format(tag: string, color: string) {
  return `${color}${colors.bold}[${tag}]${colors.reset}`;
}

const validateEnv = (env: Record<string, string | number | undefined>) => {
  const missing = Object.entries(env)
    .filter(([, value]) => value === undefined || value === "")
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error(
      format("env", colors.red),
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    console.error(
      format("env", colors.red),
      "Please update your .env file and restart the server.",
    );
    process.exit(1);
  }
};

export const ENV = {
  PORT: process.env.PORT!,
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN!,
  NODE_ENV: process.env.NODE_ENV!,
  SQLITE_PATH: process.env.SQLITE_PATH!,
  REDIS_URL: process.env.REDIS_URL!,
  WORKER_POLL_INTERVAL_MS: Number(process.env.WORKER_POLL_INTERVAL_MS) || 1000,
  STARVATION_CHECK_INTERVAL_MS:
    Number(process.env.STARVATION_CHECK_INTERVAL_MS) || 120000,
  STARVATION_THRESHOLD_MS: Number(process.env.STARVATION_THRESHOLD_MS) || 300000,
  DLQ_ALERT_THRESHOLD: Number(process.env.DLQ_ALERT_THRESHOLD) || 10,
  DLQ_ALERT_WEBHOOK_URL: process.env.DLQ_ALERT_WEBHOOK_URL!,
};

validateEnv(ENV);
