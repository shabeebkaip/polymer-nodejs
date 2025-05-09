import express from 'express';
import Grade from '../../../models/grade.js';

const gradeUpdate = express.Router();

gradeUpdate.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const data = req.body
        
        const grade = await Grade.findByIdAndUpdate(id,data)
        if (!grade) {
            return res.status(404).json({ status: false, message: "Not found" })
        }
        res.status(200).json({   success: true,
            status: true, message: "Updated succesfully" })

    } catch (error) {
        res.status(500).json({ status: false, message: "Internal server error" })
    }
})

export default gradeUpdate
