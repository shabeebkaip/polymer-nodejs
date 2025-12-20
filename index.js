import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import router from "./routes/routes.js";
import { Server } from "socket.io";
import http from 'http';
import initSocket from "./socket.js";
import { config, validateConfig, getCurrentUrl } from "./config/config.js";

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

console.log(`🚀 Starting Polymer Hub API in ${config.nodeEnv} mode`);
console.log(`🌐 Frontend URL: ${getCurrentUrl()}`);

if (!DB_URL) {
  console.error("Error: MONGO URL not defined in .env file");
  process.exit(1);
}

mongoose
  .connect(DB_URL)
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Unable to connect database:", err));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

const server = http.createServer(app);

// TODO: Configure allowed origins for production
// const allowedOrigins = [
//   "https://staging.polymershub.com",
//   "https://admin.polymershub.com",
//   "https://polymershub.com",
//   "https://www.polymershub.com",
//   "http://localhost:3000",
//   "http://localhost:3001",
//   "http://localhost:5173"
// ];

const corsOptions = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

const io = new Server(server, { cors: { origin: "*", credentials: true } });

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files for testing
app.use('/public', express.static('public'));

// Test page route
app.get('/chat-test', (req, res) => {
  res.sendFile('public/chat-test.html', { root: '.' });
});

app.use("/api", router);

initSocket(io);

server.listen(port, () => {
  console.log(`🚀 Server connected at http://localhost:${port}`);
  console.log(`🧪 Chat test page: http://localhost:${port}/chat-test`);
  console.log(`📡 Socket.IO ready for connections`);
});
