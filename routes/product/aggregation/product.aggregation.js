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
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    // {
    //   $match: {
    //     "user.verification": "approved"
    //   }
    // },
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
    { $unwind: { path: "$chemicalFamily", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "polymertypes",
        localField: "polymerType",
        foreignField: "_id",
        as: "polymerType"
      }
    },
    { $unwind: { path: "$polymerType", preserveNullAndEmptyArrays: true } },
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
    { $unwind: { path: "$physicalForm", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "productfamilies",
        localField: "product_family",
        foreignField: "_id",
        as: "productfamilie"
      }
    },
    {
      $lookup: {
        from: "packagingtypes",
        localField: "packagingType",
        foreignField: "_id",
        as: "packageType"
      }
    },
    {
      $lookup: {
        from: "paymentterms",
        localField: "paymentTerms",
        foreignField: "_id",
        as: "paymentTerms"
      }
    },
    { $unwind: { path: "$paymentTerms", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        productName: 1,
        chemicalName: 1,
        description: { $ifNull: [{ $trim: { input: "$description" } }, ""] },
        ar_description: { $ifNull: [{ $trim: { input: "$ar_description" } }, ""] },
        ger_description: { $ifNull: [{ $trim: { input: "$ger_description" } }, ""] },
        cn_description: { $ifNull: [{ $trim: { input: "$cn_description" } }, ""] },
        additionalInfo: 1,
        tradeName: 1,
        chemicalFamily: {
          _id: "$chemicalFamily._id",
          name: { $ifNull: [{ $trim: { input: "$chemicalFamily.name" } }, ""] },
          ar_name: { $ifNull: [{ $trim: { input: "$chemicalFamily.ar_name" } }, ""] },
          ger_name: { $ifNull: [{ $trim: { input: "$chemicalFamily.ger_name" } }, ""] },
          cn_name: { $ifNull: [{ $trim: { input: "$chemicalFamily.cn_name" } }, ""] },
        },
    
        polymerType: {
          _id: "$polymerType._id",
          name: { $ifNull: [{ $trim: { input: "$polymerType.name" } }, ""] },
          ar_name: { $ifNull: [{ $trim: { input: "$polymerType.ar_name" } }, ""] },
          ger_name: { $ifNull: [{ $trim: { input: "$polymerType.ger_name" } }, ""] },
          cn_name: { $ifNull: [{ $trim: { input: "$polymerType.cn_name" } }, ""] },
        },
        industry: {
          $map: {
            input: { $ifNull: ["$industry", []] },
            as: "ind",
            in: {
              _id: "$$ind._id",
              name: { $ifNull: [{ $trim: { input: "$$ind.name" } }, ""] },
              ar_name: { $ifNull: [{ $trim: { input: "$$ind.ar_name" } }, ""] },
              ger_name: { $ifNull: [{ $trim: { input: "$$ind.ger_name" } }, ""] },
              cn_name: { $ifNull: [{ $trim: { input: "$$ind.cn_name" } }, ""] }
            }
          }
        },
    
        grade: {
          $map: {
            input: { $ifNull: ["$grade", []] },
            as: "g",
            in: {
              _id: "$$g._id",
              name: { $ifNull: [{ $trim: { input: "$$g.name" } }, ""] },
              ar_name: { $ifNull: [{ $trim: { input: "$$g.ar_name" } }, ""] },
              ger_name: { $ifNull: [{ $trim: { input: "$$g.ger_name" } }, ""] },
              cn_name: { $ifNull: [{ $trim: { input: "$$g.cn_name" } }, ""] }
            }
          }
        },
    
        physicalForm: {
          _id: "$physicalForm._id",
          name: { $ifNull: [{ $trim: { input: "$physicalForm.name" } }, ""] },
          ar_name: { $ifNull: [{ $trim: { input: "$physicalForm.ar_name" } }, ""] },
          ger_name: { $ifNull: [{ $trim: { input: "$physicalForm.ger_name" } }, ""] },
          cn_name: { $ifNull: [{ $trim: { input: "$physicalForm.cn_name" } }, ""] }
        },
        
        manufacturingMethod: 1,
        countryOfOrigin: 1,
        color: 1,
        productImages: 1,
        density: 1,
        mfi: 1,
        tensileStrength: 1,
        elongationAtBreak: 1,
        shoreHardness: 1,
        waterAbsorption: 1,
        safety_data_sheet: "$safety_data_sheet",
        technical_data_sheet: "$technical_data_sheet",
        certificate_of_analysis: "$certificate_of_analysis",
        minimum_order_quantity: 1,
        stock: 1,
        uom: 1,
        price: 1,
        priceTerms: 1,
        incoterms: {
          $map: {
            input: { $ifNull: ["$incoterms", []] },
            as: "term",
            in: {
              _id: "$$term._id",
              name: { $ifNull: [{ $trim: { input: "$$term.name" } }, ""] },
            }
          }
        },
    
        leadTime: 1,
        paymentTerms: {
          _id: "$paymentTerms._id",
          name: { $ifNull: [{ $trim: { input: "$paymentTerms.name" } }, ""] },
          ar_name: { $ifNull: [{ $trim: { input: "$paymentTerms.ar_name" } }, ""] },
          ger_name: { $ifNull: [{ $trim: { input: "$paymentTerms.ger_name" } }, ""] },
          cn_name: { $ifNull: [{ $trim: { input: "$paymentTerms.cn_name" } }, ""] }
        },
    
        packagingType: {
          $map: {
            input: { $ifNull: ["$packageType", []] },
            as: "pt",
            in: {
              _id: "$$pt._id",
              name: { $ifNull: [{ $trim: { input: "$$pt.name" } }, ""] },
              ar_name: { $ifNull: [{ $trim: { input: "$$pt.ar_name" } }, ""] },
              ger_name: { $ifNull: [{ $trim: { input: "$$pt.ger_name" } }, ""] },
              cn_name: { $ifNull: [{ $trim: { input: "$$pt.cn_name" } }, ""] }
            }
          }
        },
    
        packagingWeight: 1,
        storageConditions: 1,
        shelfLife: 1,    
        recyclable: 1,
        fdaApproved: 1,
          fdaCertificate: { $ifNull: ["$fdaCertificate", {}] },
        bioDegradable: 1,
        medicalGrade: 1,
          medicalCertificate: { $ifNull: ["$medicalCertificate", {}] },
        certificates: { $ifNull: ["$certificates", []] },
        product_family: {
          $map: {
            input: { $ifNull: ["$productfamilie", []] },
            as: "pf",
            in: {
              _id: "$$pf._id",
              name: { $ifNull: [{ $trim: { input: "$$pf.name" } }, ""] },
              ar_name: { $ifNull: [{ $trim: { input: "$$pf.ar_name" } }, ""] },
              ger_name: { $ifNull: [{ $trim: { input: "$$pf.ger_name" } }, ""] },
              cn_name: { $ifNull: [{ $trim: { input: "$$pf.cn_name" } }, ""] }
            }
          }
        },
        
        createdBy: {
          name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          email: "$user.email",
          company: "$user.company",
          company_logo: "$user.company_logo",
          website: "$user.website",
          phone: "$user.phone",
          address:"$user.address",
          location:"$user.location",
          _id: "$user._id"

        }
      }
    }
  ];

  return pipeline;
};
