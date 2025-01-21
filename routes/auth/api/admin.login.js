import express from 'express';
import { authenticate, createJwt, validate, verify } from '../../../middlewares/login.auth.js';

const adminLogin = express.Router()

adminLogin.post('/login', validate, verify, authenticate, createJwt, async (req, res) => {
    try {
        delete req.body.password;
        delete req.body.username;
        delete req.body.auth;
        res.status(200).json({
            status: true,
            message: 'Login Success.',
            token: req.body.token,
        })
    } catch (error) {
        res.status(500).json({ message: 'Unable to verify the credentials.' })
    }
})


export default adminLogin