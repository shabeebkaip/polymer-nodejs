import express from 'express';
import adminInfo from './api/admin-info.js';
import adminCreateUser from './api/admin-create-user.js';

const adminRouter = express.Router();

adminRouter.use('/user-info', adminInfo);
adminRouter.use('/users', adminCreateUser);

export default adminRouter;
