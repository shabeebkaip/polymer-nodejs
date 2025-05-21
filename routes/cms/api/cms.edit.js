import express from 'express';
import generateRandomId from '../../../common/random.js';
import Cms from '../../../models/cms.js';

const cmsEdit = express.Router();

cmsEdit.put('/:section/:id?', async (req, res) => {
    const { section, id } = req.params;
    const { content } = req.body;

    try {
        const existingSection = await Cms.findOne({ section });

        if (!existingSection) {
            return res.status(404).json({ status: false, message: 'Section not found' });
        }

        if (id) {
            // Update a specific item inside the content array
            const updateFields = {};
            Object.keys(content).forEach(key => {
                if (key !== "_id") {
                    updateFields[`content.$.${key}`] = content[key];
                }
            });

            const updatedSingleSection = await Cms.findOneAndUpdate(
                { section, 'content._id': id },
                { $set: updateFields },
                { new: true }
            );

            if (!updatedSingleSection) {
                return res.status(404).json({ status: false, message: 'Object not found' });
            }

            return res.status(200).json({ status: true, message: 'Object updated successfully!' });
        } else if (Array.isArray(content)) {
            // Append multiple items to the content array
            const newObjects = content.map(item => ({
                _id: generateRandomId(6),
                ...item,
            }));

            await Cms.findOneAndUpdate(
                { section },
                { $push: { content: { $each: newObjects } } },
                { new: true }
            );

            return res.status(200).json({ status: true, message: 'Content added to section successfully!' });
        } else {
            // Replace the entire content field
            await Cms.findOneAndUpdate(
                { section },
                { $set: { content } },
                { new: true }
            );

            return res.status(200).json({ status: true, message: 'Section updated successfully!' });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: 'Error updating section', error: error.message });
    }
});

export default cmsEdit;
