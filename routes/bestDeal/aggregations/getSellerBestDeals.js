import mongoose from "mongoose";

const getSellerBestDeals = async (sellerId) => {
  return mongoose.model("BestDeal").aggregate([
    {
      $match: { sellerId: new mongoose.Types.ObjectId(sellerId) }
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    {
      $unwind: "$productDetails"
    },
    {
      $project: {
        offerPrice: 1,
        status: 1,
        adminNote: 1,
        createdAt: 1,
        updatedAt: 1,
        productDetails: {
          productName: 1,
          chemicalName: 1,
          description: 1,
          ar_description: 1,
          ger_description: 1,
          cn_description: 1,
          additionalInfo: 1,
          tradeName: 1,
          chemicalFamily: 1,
          polymerType: 1,
          industry: 1,
          grade: 1,
          manufacturingMethod: 1,
          physicalForm: 1,
          countryOfOrigin: 1,
          color: 1,
          productImages: 1,
          density: 1,
          mfi: 1,
          tensileStrength: 1,
          elongationAtBreak: 1,
          shoreHardness: 1,
          waterAbsorption: 1,
          safety_data_sheet: 1,
          technical_data_sheet: 1,
          certificate_of_analysis: 1,
          minimum_order_quantity: 1,
          stock: 1,
          uom: 1,
          price: 1,
          priceTerms: 1,
          incoterms: 1,
          leadTime: 1,
          paymentTerms: 1,
          packagingType: 1,
          packagingWeight: 1,
          storageConditions: 1,
          shelfLife: 1,
          recyclable: 1,
          bioDegradable: 1,
          fdaApproved: 1,
          medicalGrade: 1,
          product_family: 1,
          createdBy: 1,
        }
      }
    }
  ]);
};

export default getSellerBestDeals;
