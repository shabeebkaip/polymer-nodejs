import express from 'express';
import Incoterm from '../../../models/incoterm.js';

const incotermUpdate = express.Router();

incotermUpdate.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const data = req.body
        
        const chemical = await Incoterm.findByIdAndUpdate(id,data)
        if (!chemical) {
            return res.status(404).json({ status: false, message: "Not found" })
        }
        res.status(200).json({      success: true,
            status: true, message: "Updated succesfully" })

    } catch (error) {
        res.status(500).json({ status: false, message: "Internal server error" })
    }
})

export default incotermUpdate
