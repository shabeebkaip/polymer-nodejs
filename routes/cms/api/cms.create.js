import express from 'express';
import generateRandomId from '../../../common/random.js';
import Cms from '../../../models/cms.js';

const cmsCreate = express.Router();

cmsCreate.post('/:section?', async (req, res) => {
  try {
    const sectionName = req.params.section || req.body.section;
    const { content } = req.body;

    if (!sectionName) {
      return res.status(400).json({ success: false, message: 'Section is required' });
    }

    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const formatContent = (item) => ({
      _id: item._id || generateRandomId(),
      ...item,
    });

    const section = await Cms.findOne({ section: sectionName });

    if (!section) {
      const newContent = Array.isArray(content)
        ? content.map(formatContent)
        : content;

      const newSection = await Cms.create({
        section: sectionName,
        content: newContent,
      });

      return res.status(201).json({
        success: true,
        message: 'New section created',
        data: newSection,
      });
    }

    if (!Array.isArray(section.content)) {
      return res.status(400).json({
        success: false,
        message: `Section "${sectionName}" content is not an array. Cannot append content.`,
      });
    }

    const newItems = Array.isArray(content)
      ? content.map(formatContent)
      : [formatContent(content)];

    const updatedSection = await Cms.findOneAndUpdate(
      { section: sectionName },
      { $push: { content: { $each: newItems } } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'added successfully',
      data: updatedSection,
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

export default cmsCreate;
