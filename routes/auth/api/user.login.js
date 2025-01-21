import express from 'express';
import { authenticate, createJwt, validate, verify } from '../../../middlewares/login.auth.js';

const userLogin = express.Router()

userLogin.post('/login', validate, verify, authenticate, createJwt, async (req,res) => {
    try {
        res.status(200).json({
            status: true,
            message: 'Login Sucecess',
            token: req.body.token,
        })
    }
    catch(error){
        res.status(500).json({ message: 'Unable to verify the credentials.' })
    }
}) 


export default userLogin