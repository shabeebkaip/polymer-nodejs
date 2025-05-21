import express from 'express';
import Cms from '../../../models/cms.js';

const cmsCreate = express.Router();

cmsCreate.post('', async (req, res) => {
  const { section, content } = req.body;

  try {
    const newSection = new Cms({ section, content });
    await newSection.save();
    res.status(200).json({ status: true, message: 'Section added successfully!' });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Error adding section', error: error.message });
  }
});

export default cmsCreate;
