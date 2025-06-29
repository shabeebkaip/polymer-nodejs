import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import router from "./routes/routes.js";
import { Server } from "socket.io";
import http from 'http';
import initSocket from "./socket.js";

dotenv.config({ path: ".env" });
const app = express();
const DB_URL = process.env.MONGO;
const port = process.env.PORT || 7000;

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
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());



app.use("/api", router);

initSocket(io);

app.listen(port, () => console.log(`Server connected at ${port}`));
