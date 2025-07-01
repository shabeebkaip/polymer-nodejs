import express from 'express';
import User from '../../../models/user.js';
import Product from '../../../models/product.js';
import QuoteRequest from '../../../models/quoteRequest.js';

const dashboardList = express.Router();

dashboardList.get('/', async (req, res) => {
    try {
        const [buyerCount, sellerCount] = await Promise.all([
            User.countDocuments({ user_type: 'buyer' }),
            User.countDocuments({ user_type: 'seller' }),
        ]);

        const productCount = await Product.countDocuments();

        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

        const monthlyEnquiries = await QuoteRequest.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfYear, $lte: endOfYear },
                },
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);

        const fullMonthData = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const monthData = monthlyEnquiries.find((m) => m._id === month);
            return { month, enquiries: monthData ? monthData.count : 0 };
        });

        return res.status(200).json({
            status: true,
            message: 'Dashboard data fetched successfully',
            cardCounts: {
                buyers: buyerCount,
                sellers: sellerCount,
                products: productCount,
            },
            chartData:{ quoteEnquiryGraph: fullMonthData,}

        });

    } catch (error) {
        console.error('Dashboard fetch error:', error);
        return res.status(500).json({
            status: false,
            message: 'Failed to fetch dashboard data',
            error: error.message,
        });
    }
});

export default dashboardList;
