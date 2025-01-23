import mongoose from "mongoose";
import Enquiry from "../../../models/enquiry.js";

export const getEnquiryAgg = async (query) => {
    const { sellerId, limit,page } = query;

    const skip = (page - 1) * limit;

    const baseAggregation = [
        ...(sellerId ? [{ $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } }] : []),
        {
            $lookup: {
                from: "users",
                localField: "custumerId",
                foreignField: "_id",
                as: "custumer",
            },
        },
        { $unwind: { path: "$custumer", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "users",
                localField: "sellerId",
                foreignField: "_id",
                as: "seller",
            },
        },
        { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "product",
            },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    ];

    const aggregation = [
        ...baseAggregation,
        { $skip: skip },
        { $limit: limit },
        {
            $project: {
                message: 1,
                custumer: "$custumer.name",
                custumerMail: "$custumer.email",
                custumerPhone: "$custumer.mobile",
                seller: "$seller.name",
                product: "$product.name",
                uom: 1,
                quantity: 1,
            },
        },
    ];

    const countAggregation = [
        ...baseAggregation,
        { $count: "totalCount" },
    ];

    const enquiries = await Enquiry.aggregate(aggregation);

    const countResult = await Enquiry.aggregate(countAggregation);
    const totalEnquiries = countResult.length > 0 ? countResult[0].totalCount : 0;

    return { enquiries, totalEnquiries };
};