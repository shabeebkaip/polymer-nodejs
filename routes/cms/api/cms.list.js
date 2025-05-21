import express from 'express';
import Cms from '../../../models/cms.js';

const cmsList = express.Router();

const buildCmsResult = (cms, isArabic) => {
  const title = cms.some(item => item.title);

  const components = isArabic ? [
    { name: "image", displayName: "Image", component: "image" },
    ...(title ? [{ name: "ar_title", displayName: "Title (AR)", component: "text" }] : []),
    { name: "edit", displayName: "Edit", component: "action" }
  ] : [
    { name: "image", displayName: "Image", component: "image" },
    ...(title ? [{ name: "title", displayName: "Title", component: "text" }] : []),
    { name: "description", displayName: "Description", component: "text" },
    { name: "edit", displayName: "Edit", component: "action" }
  ];

  const result = {
    components,
    data: []
  };

  cms.forEach(cmsItem => {
    const row = {
      id: cmsItem._id,
      image: cmsItem.image,
      ar_title: cmsItem.ar_title,
      ar_description: cmsItem.ar_description,
      title: cmsItem.title,
      description: cmsItem.description,
      edit: { name: "edit", icon: "edit.svg", displayName: "Edit", id: cmsItem._id }
    };
    result.data.push(row);
  });

  return result;
};

cmsList.get('/:section?/:id?', async (req, res) => {
  const { section, id } = req.params;
  const isArabic = req.language === 'ar';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const skip = (page - 1) * limit;

  try {
    if (!section) {
      const sections = await Cms.find();
      return res.status(200).json({
        status: true,
        message: 'All sections retrieved successfully!',
        data: sections
      });
    }

    if (section && !id) {
      console.log(' API Hit for section:', section);

      // Fix: Make the query case-insensitive
      const sectionData = await Cms.findOne({ section: new RegExp(`^${section}$`, 'i') });

      console.log(' DB Result:', sectionData);

      if (!sectionData) {
        return res.status(404).json({ status: false, message: 'Section not found' });
      }

      if (Array.isArray(sectionData.content)) {
        const totalItems = sectionData.content.length;
        const totalPages = Math.ceil(totalItems / limit);
        const paginatedContent = sectionData.content.slice(skip, skip + limit);

        const result = buildCmsResult(paginatedContent, isArabic);

        return res.status(200).json({
          status: true,
          message: 'Section with paginated content fetched successfully!',
          components: result.components,
          data: result.data,
          totalPages: totalPages
        });
      } else {
        return res.status(200).json({
          status: true,
          message: 'Section fetched successfully!',
          data: sectionData
        });
      }
    }

    if (section && id) {
      console.log(`API Hit for section "${section}" and ID "${id}"`);
      const sectionDocument = await Cms.findOne(
        { section: new RegExp(`^${section}$`, 'i'), 'content._id': id },
        { 'content.$': 1 }
      );

      if (!sectionDocument || sectionDocument.content.length === 0) {
        return res.status(404).json({ status: false, message: 'Object not found' });
      }

      return res.status(200).json({
        status: true,
        message: 'Object retrieved successfully!',
        content: sectionDocument.content[0]
      });
    }

  } catch (error) {
    console.error(' Error in cmsList:', error);
    res.status(500).json({
      status: false,
      message: 'Error retrieving data',
      error: error.message
    });
  }
});

export default cmsList;


