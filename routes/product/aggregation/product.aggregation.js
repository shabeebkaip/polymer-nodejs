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
      $lookup: {
        from: "packagingtypes",
        localField: "packagingType",
        foreignField: "_id",
        as: "packageType"
      }
    },
    {
      $project: {
        productName: 1,
        chemicalName: 1,
        description: 1,
        additionalInfo: 1,
        tradeName: 1,
        chemicalFamily: {
          _id: "$chemicalFamily._id",
          name: "$chemicalFamily.name"
        },
        polymerType: {
          _id: "$polymerType._id",
          name: "$polymerType.name"
        },
        industry: {
          $map: {
            input: "$industry",
            as: "ind",
            in: {
              id: "$$ind._id",
              name: "$$ind.name"
            }
          }
        },
        grade: {
          $map: {
            input: "$grade",
            as: "g",
            in: {
              id: "$$g._id",
              name: "$$g.name"
            }
          }
        },
        physicalForm: {
          _id: "$physicalForm._id",
          name: "$physicalForm.name"
        },
        manufacturingMethod: 1,
        countryOfOrigin: 1,
        color: 1,
        productImages: 1,
        stock: 1,
        price: 1,
        uom: 1,
        incoterms: {
          $map: {
            input: "$incoterms",
            as: "term",
            in: {
              id: "$$term._id",
              name: "$$term.name"
            }
          }
        },
        recyclable: 1,
        fdaApproved: 1,
        bioDegradable: 1,
        medicalGrade: 1,
        product_family: {
          $map: {
            input: "$productfamilie",
            as: "pf",
            in: {
              id: "$$pf._id",
              name: "$$pf.name"
            }
          }
        },
        packageType: {
          $map: {
            input: "$packageType",
            as: "pt",
            in: {
              id: "$$pt._id",
              name: "$$pt.name"
            }
          }
        },
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
