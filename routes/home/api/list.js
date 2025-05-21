import express from 'express';
import Cms from '../../../models/cms.js';
import User from '../../../models/user.js';
import Product from '../../../models/product.js';

const homeList = express.Router();

homeList.get('/', async (req, res) => {
  try {

    const [buyerBenefits, supplierBenefits] = await Promise.all([
      Cms.findOne({ section: 'BenefitsForBuyer' }),
      Cms.findOne({ section: 'BenefitsForSuplier' }),
    ]);

    const verifiedUsers = await User.find({
      $or: [
        { user_type: 'seller', verification: 'approved' },
        { user_type: 'superAdmin' }
      ]
    }).select('_id');

    const verifiedSellerCount = verifiedUsers.length;
    const verifiedUserIds = verifiedUsers.map(user => user._id);

    const productCount = await Product.countDocuments({
      createdBy: { $in: verifiedUserIds }
    });

    res.status(200).json({
      status: true,
      message: 'Dashboard summary fetched successfully!',
      data: {
        buyerBenefits: buyerBenefits?.content || [],
        supplierBenefits: supplierBenefits?.content || [],
        verifiedSellerCount,
        productCount
      }
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Error fetching dashboard summary',
      error: error.message
    });
  }
});

export default homeList;
