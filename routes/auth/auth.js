import express from 'express';
import adminLogin from './api/admin.login.js';
import userRegister from './api/user.register.js';
import setPasswordRouter from './api/user.setPassword.js';
import userLogin from './api/user.login.js';
import userInfo from './api/user.info.js';

const authRouter = express.Router()


authRouter.use('/admin',adminLogin)
authRouter.use('/user',userRegister)
authRouter.use('/user', setPasswordRouter )
authRouter.use('/user', userLogin )
authRouter.use('/user', userInfo )




export default authRouter
