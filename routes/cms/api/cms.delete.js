import express from 'express';
import Cms from '../../../models/cms.js';

const cmsDelete = express.Router();

cmsDelete.delete('/:section/:id', async (req, res) => {
  const { section, id } = req.params;

  try {
    const sectionDocument = await Cms.findOne({ section });

    if (!sectionDocument) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const initialContentLength = sectionDocument.content.length;

    const updatedSingleSection = await Cms.findOneAndUpdate(
      { section },
      { $pull: { content: { _id: id } } },
      { new: true }
    );

    const finalContentLength = updatedSingleSection.content.length;

    if (initialContentLength === finalContentLength) {
      return res.status(404).json({ success: false, message: 'Item not found in section' });
    }

    res.status(200).json({ success: true, message: 'Deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

export default cmsDelete;
