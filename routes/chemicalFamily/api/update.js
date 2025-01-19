import express from 'express';
import ChemicalFamily from '../../../models/chemicalFamily.js';


const chemicalFamilyUpdate = express.Router();

chemicalFamilyUpdate.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const data = req.body
        console.log(data);
        
        const chemical = await ChemicalFamily.findByIdAndUpdate(id,data)
        if (!chemical) {
            return res.status(404).json({ status: false, message: "Not found" })
        }
        res.status(200).json({ status: true, message: "Updated succesfully" })

    } catch (error) {
        res.status(500).json({ status: false, message: "Internal server error" })
    }
})

export default chemicalFamilyUpdate
