import express from 'express';
import getUserNotifications from './api/getUserNotifications.js';

const notificationRouter = express.Router();

notificationRouter.use("", getUserNotifications);

export default notificationRouter;