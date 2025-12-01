import express from 'express';
import { streamFile } from './api/file.upload.js';

const fileViewRouter = express.Router();

fileViewRouter.get('/view/*', streamFile);

export default fileViewRouter;
