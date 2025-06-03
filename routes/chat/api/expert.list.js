
import express from 'express';
import User from '../../../models/user.js';

const expertListRouter = express.Router()

expertListRouter.post('', async (req, res) => {

    const { company } = req.body
    const experts = await User.find({ company }).select('firstName lastName email phone profile_image')

    res.status(200).json(experts)
})

export default expertListRouter