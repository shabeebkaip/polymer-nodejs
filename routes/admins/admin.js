import express, { Router } from 'express';
import adminInfo from './api/admin-info.js';


const adminRouter = express.Router();

adminRouter.use('/user-info', adminInfo)

export default adminRouter  