import express from 'express';
import adminLogin from './api/admin.login.js';
import userRegister from './api/user.register.js';
import setPasswordRouter from './api/user.setPassword.js';
import userLogin from './api/user.login.js';
import userInfo from './api/user.info.js';
import userSidebar from './api/sidebar.js';
import changePassword from './api/user.change.password.js';
import forgetPassword from './api/user.forget.password.js';
import verifyOtp from './api/user.verify.otp.js';
import resetPassword from './api/user.reset.password.js';


const authRouter = express.Router()

authRouter.use('/admin',adminLogin)
authRouter.use('/user',userRegister)
authRouter.use('/user', setPasswordRouter )
authRouter.use('/user', userLogin )
authRouter.use('/user', userInfo )
authRouter.use('/side-bar', userSidebar )
authRouter.use('/user/change-password', changePassword )
authRouter.use('/user/forgot-password', forgetPassword )
authRouter.use('/user/verify-otp', verifyOtp )
authRouter.use('/user/reset-password', resetPassword )



export default authRouter
