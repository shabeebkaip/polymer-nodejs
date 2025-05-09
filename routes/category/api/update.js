import express from 'express';
import Category from '../../../models/category.js';

const categoryUpdate = express.Router();

categoryUpdate.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const data = req.body
        // console.log(data);
        
        const categories = await Category.findByIdAndUpdate(id,data)
        if (!categories) {
            return res.status(404).json({ status: false, message: "Not found" })
        }
        res.status(200).json({ status: true, message: "Updated succesfully" })

    } catch (error) {
        res.status(500).json({ status: false, message: "Internal server error" })
    }
})

export default categoryUpdate
