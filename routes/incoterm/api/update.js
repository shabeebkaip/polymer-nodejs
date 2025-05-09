import express from 'express';
import Incoterm from '../../../models/incoterm.js';

const incotermUpdate = express.Router();

incotermUpdate.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const incoterm = await Incoterm.findByIdAndUpdate(id, data, { new: true });
        if (!incoterm) {
            return res.status(404).json({ success: false, message: "Incoterm not found" });
        }

        res.status(200).json({
            success: true,
            message: "Updated successfully",
            data: incoterm,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default incotermUpdate