import express from 'express';
import { verifyToken } from '../../../middlewares/verify.token.js';
import User from '../../../models/user.js';


const userInfo = express.Router();

userInfo.get('', verifyToken, async (req, res) => {
    try {
 
        const userEmail = req.body.email;

        if (!userEmail) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const userData = await User.findOne({ email: userEmail });

        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).send({ userData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default userInfo;

