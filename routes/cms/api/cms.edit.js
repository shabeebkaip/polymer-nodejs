import express from 'express';
import Cms from '../../../models/cms.js';


const cmsEdit = express.Router();

cmsEdit.put('/:section',(async (req, res) => {
  try {
    const { section } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ status: false, message: 'Content is required' });
    }

    const updatedSection = await Cms.findOneAndUpdate(
      { section },
      { content },
      { new: true }
    );

    if (!updatedSection) {
      return res.status(404).json({ status: false, message: `Section "${section}" not found.` });
    }

    return res.status(200).json({
      status: true,
      message: 'updated successfully.',
      data: updatedSection,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}));

cmsEdit.put('/:section/:id',(async (req, res) => {
  try {
    const { section, id } = req.params;
    const updates = req.body;

    const sectionDoc = await Cms.findOne({ section });

    if (!sectionDoc) {
      return res.status(404).json({
        success: false,
        message: `Section "${section}" not found.`,
      });
    }

    if (!Array.isArray(sectionDoc.content)) {
      return res.status(400).json({
        success: false,
        message: `Section "${section}" content is not an array.`,
      });
    }

    const contentArray = sectionDoc.content;
    const itemIndex = contentArray.findIndex(item => item._id?.toString() === id);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Item with id "${id}" not found in section "${section}".`,
      });
    }

    contentArray[itemIndex] = {
      ...contentArray[itemIndex],
      ...updates,
    };

    sectionDoc.markModified('content');
    await sectionDoc.save();

    return res.status(200).json({
      success: true,
      message: 'updated successfully.',
      data: contentArray[itemIndex],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}));

export default cmsEdit;
