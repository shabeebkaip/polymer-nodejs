import express from "express"
import cors from 'cors'
import mongoose from "mongoose";
import dotenv from 'dotenv';
import fileUpload from "express-fileupload";
import router from "./routes/routes.js";

dotenv.config({ path: '.env' });
const app = express();
const DB_URL = process.env.MONGO;
const port = process.env.PORT || 6000;

if (!DB_URL) {
    console.error('Error: MONGO URL not defined in .env file');
    process.exit(1);
}

mongoose.connect(DB_URL)
    .then(() => console.log('Database connected successfully'))
    .catch((err) => console.error('Unable to connect database:', err));

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

app.use(cors());
app.use(express.json());

app.use('/api', router);

app.listen(port, () => console.log(`Server connected at ${port}`));
