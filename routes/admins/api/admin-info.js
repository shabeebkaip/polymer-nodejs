import { verifyToken } from "../../../middlewares/verify.token.js";
import express from 'express';
import Admin from "../../../models/admin.js";
const adminInfo = express.Router();

adminInfo.get('', verifyToken, async (req, res) => {
    try {
        const userInfo = await Admin.findOne({ email: req.body.email });
    
        res.status(200).send({ userInfo});
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export  default adminInfo