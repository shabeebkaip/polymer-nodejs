import express from 'express';
import getUserNotifications from './api/getUserNotifications.js';
import markAsRead from './api/markAsRead.js';
import markAllAsRead from './api/markAllAsRead.js';
import getUnreadCount from './api/getUnreadCount.js';

const notificationRouter = express.Router();

notificationRouter.use("", getUserNotifications);
notificationRouter.use("", markAsRead);
notificationRouter.use("", markAllAsRead);
notificationRouter.use("", getUnreadCount);

export default notificationRouter;