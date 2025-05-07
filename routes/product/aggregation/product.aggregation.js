export const productAggregation = (filters = {}) => {
  const pipeline = [
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $match: {
        "user.verification": "approved"
      }
    },
    {
      $lookup: {
        from: "industries",
        localField: "industry",
        foreignField: "_id",
        as: "industry"
      }
    },
    {
      $lookup: {
        from: "chemicalfamilies",
        localField: "chemicalFamily",
        foreignField: "_id",
        as: "chemicalFamily"
      }
    },
    {
      $unwind: "$chemicalFamily"
    },
    {
      $lookup: {
        from: "polymertypes",
        localField: "polymerType",
        foreignField: "_id",
        as: "polymerType"
      }
    },
    {
      $unwind: "$polymerType"
    },
    {
      $lookup: {
        from: "grades",
        localField: "grade",
        foreignField: "_id",
        as: "grade"
      }
    },
    {
      $lookup: {
        from: "incoterms",
        localField: "incoterms",
        foreignField: "_id",
        as: "incoterms"
      }
    },
    {
      $lookup: {
        from: "physicalforms",
        localField: "physicalForm",
        foreignField: "_id",
        as: "physicalForm"
      }
    },
    {
      $unwind: "$physicalForm"
    },
    {
      $lookup: {
        from: "productfamilies",
        localField: "product_family",
        foreignField: "_id",
        as: "productfamilie"
      }
    },
    {
      $project: {
        productName: 1,
        chemicalName: 1,
        description: 1,
        additionalInfo: 1,
        tradeName: 1,
        chemicalFamily: "$chemicalFamily.name",
        polymerType: "$polymerType.name",
        industry: "$industry.name",
        grade: "$grade.name",
        manufacturingMethod: 1,
        physicalForm: "$physicalForm.name",
        countryOfOrigin: 1,
        color: 1,
        productImages: 1,
        stock: 1,
        price: 1,
        uom: 1,
        incoterms: "$incoterms.name",
        recyclable: 1,
        fdaApproved: 1,
        bioDegradable: 1,
        medicalGrade: 1,
        product_family: "$productfamilie.name",
        createdBy: {
          name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          email: "$user.email",
          company: "$user.company",
          website: "$user.website",
          phone: "$user.phone"
        }
      }
    }
  ];

  return pipeline;
};
