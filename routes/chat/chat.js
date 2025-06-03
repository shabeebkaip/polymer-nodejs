
import express from 'express';
import expertListRouter from './api/expert.list.js';
import allMessagesRouter from './api/all.messages.js';

const chatRouter = express.Router()

chatRouter.use('/expert-list', expertListRouter)
chatRouter.use('/messages', allMessagesRouter)

export default chatRouter