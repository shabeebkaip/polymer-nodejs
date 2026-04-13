import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import router from "./routes/routes.js";
import { config, validateConfig, getCurrentUrl } from "./config/config.js";
import { initRedis } from "./utils/redis.js";

dotenv.config({ path: ".env" });

// Validate required environment variables
try {
  validateConfig();
} catch (error) {
  console.error("Configuration Error:", error.message);
  process.exit(1);
}

const app = express();
const DB_URL = config.mongoUri;
const port = config.port;

console.log(`🚀 Starting PolymersHub API in ${config.nodeEnv} mode`);
console.log(`🌐 Frontend URL: ${getCurrentUrl()}`);

if (!DB_URL) {
  console.error("Error: MONGO URL not defined in .env file");
  process.exit(1);
}

mongoose
  .connect(DB_URL)
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => console.error("❌ Unable to connect database:", err));

// Initialize Redis connection (auto-connects)
initRedis();

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

const corsOptions = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from public directory
app.use('/public', express.static('public'));

// Log logo URL
console.log(`🖼️  Logo available at: http://localhost:${port}/public/logo.png`);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api", router);

app.listen(port, () => {
  console.log(`🚀 Server connected at http://localhost:${port}`);
  console.log(`🖼️  Logo URL: http://localhost:${port}/public/logo.png`);
});
