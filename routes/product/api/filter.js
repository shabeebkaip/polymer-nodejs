import express from 'express';
import ChemicalFamily from '../../../models/chemicalFamily.js';
import PolymerType from '../../../models/polymerType.js';
import Industry from '../../../models/industry.js';
import Grade from '../../../models/grade.js';
import PhysicalForm from '../../../models/physicalForm.js';
import Incoterm from '../../../models/incoterm.js';
import PaymentTerms from '../../../models/paymentTerms.js';
import PackagingType from '../../../models/packagingType.js';
import User from '../../../models/user.js';
import Product from '../../../models/product.js';
import { ObjectId } from 'mongodb';

const productFilter = express.Router();

const buildMatchStage = (filters) => {
    const matchStage = {};
    
    if (filters.search) {
        const searchTerm = filters.search;
        if (searchTerm) {
            matchStage.productName = { $regex: searchTerm, $options: "i" };
        }
    }
    
    if (filters.chemicalFamily?.length) {
        matchStage.chemicalFamily = { $in: filters.chemicalFamily.map(id => new ObjectId(id)) };
    }
    
    if (filters.polymerType?.length) {
        matchStage.polymerType = { $in: filters.polymerType.map(id => new ObjectId(id)) };
    }
    
    if (filters.industry?.length) {
        matchStage.industry = { $in: filters.industry.map(id => new ObjectId(id)) };
    }
    
    if (filters.grade?.length) {
        matchStage.grade = { $in: filters.grade.map(id => new ObjectId(id)) };
    }
    
    if (filters.physicalForm?.length) {
        matchStage.physicalForm = { $in: filters.physicalForm.map(id => new ObjectId(id)) };
    }
    
    if (filters.countryOfOrigin?.length) {
        matchStage.countryOfOrigin = { $in: filters.countryOfOrigin };
    }
    
    if (filters.uom?.length) {
        matchStage.uom = { $in: filters.uom };
    }
    
    if (filters.priceTerms) {
        matchStage.priceTerms = filters.priceTerms;
    }
    
    if (filters.incoterms?.length) {
        matchStage.incoterms = { $in: filters.incoterms.map(id => new ObjectId(id)) };
    }
    
    if (filters.paymentTerms?.length) {
        matchStage.paymentTerms = { $in: filters.paymentTerms.map(id => new ObjectId(id)) };
    }
    
    if (filters.packagingType?.length) {
        matchStage.packagingType = { $in: filters.packagingType.map(id => new ObjectId(id)) };
    }
    
    if (filters.recyclable !== undefined) {
        matchStage.recyclable = filters.recyclable;
    }
    
    if (filters.bioDegradable !== undefined) {
        matchStage.bioDegradable = filters.bioDegradable;
    }
    
    if (filters.fdaApproved !== undefined) {
        matchStage.fdaApproved = filters.fdaApproved;
    }
    
    if (filters.medicalGrade !== undefined) {
        matchStage.medicalGrade = filters.medicalGrade;
    }
    
    if (filters.company?.length) {
        matchStage.createdBy = {
            $in: filters.company.map(id => new ObjectId(id))
        };
    }
    
    if (filters.createdBy?.length) {
        matchStage.createdBy = { $in: filters.createdBy.map(id => new ObjectId(id)) };
    }
    
    if (filters.product_family?.length) {
        matchStage.product_family = { $in: filters.product_family.map(id => new ObjectId(id)) };
    }
    
    return matchStage;
};

// Helper function to get counts for lookup fields
const getFieldCounts = async (fieldName, currentFilters = {}) => {
    const baseMatch = buildMatchStage(currentFilters);
    
    const pipeline = [
        { $match: baseMatch },
        { $group: { _id: `$${fieldName}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ];
    
    return await Product.aggregate(pipeline);
};

// Helper function to get counts for array fields
const getArrayFieldCounts = async (fieldName, currentFilters = {}) => {
    const baseMatch = buildMatchStage(currentFilters);
    
    const pipeline = [
        { $match: baseMatch },
        { $unwind: `$${fieldName}` },
        { $group: { _id: `$${fieldName}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ];
    
    return await Product.aggregate(pipeline);
};

// Helper function to get boolean field counts
const getBooleanFieldCounts = async (fieldName, currentFilters = {}) => {
    const baseMatch = buildMatchStage(currentFilters);
    
    const pipeline = [
        { $match: baseMatch },
        { $group: { _id: `$${fieldName}`, count: { $sum: 1 } } }
    ];
    
    return await Product.aggregate(pipeline);
};

// Helper function to add counts to data
const addCountsToData = (data, counts, isObjectId = false) => {
    return data.map(item => {
        const countItem = counts.find(count => {
            if (isObjectId) {
                return count._id && count._id.toString() === item._id.toString();
            }
            return count._id === item._id || count._id === item.name;
        });
        
        return {
            ...item,
            count: countItem ? countItem.count : 0
        };
    });
};

productFilter.post('/', async (req, res) => {
    try {
        const currentFilters = req.body || {};
        
        const [
            chemicalfamilies,
            polymertypes,
            industries,
            grades,
            physicalForms,
            incoterms,
            paymentTerms,
            packagingTypes,
            usersRaw
        ] = await Promise.all([
            ChemicalFamily.find({}, { name: 1 }).lean(),
            PolymerType.find({}, { name: 1 }).lean(),
            Industry.find({}, { name: 1 }).lean(),
            Grade.find({}, { name: 1 }).lean(),
            PhysicalForm.find({}, { name: 1 }).lean(),
            Incoterm.find({}, { name: 1 }).lean(),
            PaymentTerms.find({}, { name: 1 }).lean(),
            PackagingType.find({}, { name: 1 }).lean(),
            User.find({ user_type: 'seller' }, { company: 1 }).lean()
        ]);

        const users = usersRaw
            .filter(user => user.company)
            .map(user => ({
                _id: user._id,
                name: user.company
            }));

        // Get distinct values for simple fields
        const countries = await Product.distinct('countryOfOrigin');
        const uoms = await Product.distinct('uom');
        const priceTerms = ['fixed', 'negotiable'];

        // Get counts for all fields
        const [
            chemicalFamilyCounts,
            polymerTypeCounts,
            industryCounts,
            gradeCounts,
            physicalFormCounts,
            countryCounts,
            uomCounts,
            priceTermsCounts,
            incotermsCounts,
            paymentTermsCounts,
            packagingTypeCounts,
            recyclableCounts,
            bioDegradableCounts,
            fdaApprovedCounts,
            medicalGradeCounts,
            companyCounts
        ] = await Promise.all([
            getFieldCounts('chemicalFamily', currentFilters),
            getFieldCounts('polymerType', currentFilters),
            getFieldCounts('industry', currentFilters),
            getFieldCounts('grade', currentFilters),
            getFieldCounts('physicalForm', currentFilters),
            getFieldCounts('countryOfOrigin', currentFilters),
            getFieldCounts('uom', currentFilters),
            getFieldCounts('priceTerms', currentFilters),
            getFieldCounts('incoterms', currentFilters),
            getFieldCounts('paymentTerms', currentFilters),
            getFieldCounts('packagingType', currentFilters),
            getBooleanFieldCounts('recyclable', currentFilters),
            getBooleanFieldCounts('bioDegradable', currentFilters),
            getBooleanFieldCounts('fdaApproved', currentFilters),
            getBooleanFieldCounts('medicalGrade', currentFilters),
            getFieldCounts('createdBy', currentFilters)
        ]);

        // Add counts to data
        const chemicalFamiliesWithCount = addCountsToData(chemicalfamilies, chemicalFamilyCounts, true);
        const polymerTypesWithCount = addCountsToData(polymertypes, polymerTypeCounts, true);
        const industriesWithCount = addCountsToData(industries, industryCounts, true);
        const gradesWithCount = addCountsToData(grades, gradeCounts, true);
        const physicalFormsWithCount = addCountsToData(physicalForms, physicalFormCounts, true);
        const incotermsWithCount = addCountsToData(incoterms, incotermsCounts, true);
        const paymentTermsWithCount = addCountsToData(paymentTerms, paymentTermsCounts, true);
        const packagingTypesWithCount = addCountsToData(packagingTypes, packagingTypeCounts, true);
        const usersWithCount = addCountsToData(users, companyCounts, true);

        const countriesWithCount = countries.map(country => {
            const countItem = countryCounts.find(c => c._id === country);
            return {
                _id: country,
                name: country,
                count: countItem ? countItem.count : 0
            };
        });

        const uomsWithCount = uoms.map(uom => {
            const countItem = uomCounts.find(c => c._id === uom);
            return {
                _id: uom,
                name: uom,
                count: countItem ? countItem.count : 0
            };
        });

        const priceTermsWithCount = priceTerms.map(term => {
            const countItem = priceTermsCounts.find(c => c._id === term);
            return {
                _id: term,
                name: term,
                count: countItem ? countItem.count : 0
            };
        });

        const booleanOptions = [
            { _id: true, name: 'Yes' },
            { _id: false, name: 'No' }
        ];

        const recyclableWithCount = booleanOptions.map(option => {
            const countItem = recyclableCounts.find(c => c._id === option._id);
            return {
                ...option,
                count: countItem ? countItem.count : 0
            };
        });

        const bioDegradableWithCount = booleanOptions.map(option => {
            const countItem = bioDegradableCounts.find(c => c._id === option._id);
            return {
                ...option,
                count: countItem ? countItem.count : 0
            };
        });

        const fdaApprovedWithCount = booleanOptions.map(option => {
            const countItem = fdaApprovedCounts.find(c => c._id === option._id);
            return {
                ...option,
                count: countItem ? countItem.count : 0
            };
        });

        const medicalGradeWithCount = booleanOptions.map(option => {
            const countItem = medicalGradeCounts.find(c => c._id === option._id);
            return {
                ...option,
                count: countItem ? countItem.count : 0
            };
        });

        const filterSide = [
            {
                name: "chemicalFamily",
                displayName: "Chemical Family",
                component: "multiLookup",
                filterType: "array",
                collapsible: true,
                data: chemicalFamiliesWithCount
            },
            {
                name: "polymerType",
                displayName: "Polymer Type",
                component: "multiLookup",
                filterType: "array",
                collapsible: true,
                data: polymerTypesWithCount
            },
            {
                name: "industry",
                displayName: "Industry",
                component: "multiLookup",
                filterType: "array",
                collapsible: true,
                data: industriesWithCount
            },
             {
                name: "company",
                displayName: "Company",
                component: "multiLookup",
                filterType: "array",
                collapsible: true,
                searchable: true,
                data: usersWithCount
            },
            {
                name: "grade",
                displayName: "Application Grade",
                component: "multiLookup",
                filterType: "array",
                collapsible: true,
                data: gradesWithCount
            },
            {
                name: "physicalForm",
                displayName: "Physical Form",
                component: "multiLookup",
                filterType: "array",
                collapsible: true,
                data: physicalFormsWithCount
            },
            {
                name: "incoterms",
                displayName: "Incoterms",
                component: "multiLookup",
                filterType: "array",
                collapsible: false,
                data: incotermsWithCount
            },
            {
                name: "paymentTerms",
                displayName: "Payment Terms",
                component: "multiLookup",
                filterType: "array",
                collapsible: false,
                data: paymentTermsWithCount
            },
            {
                name: "packagingType",
                displayName: "Packaging Type",
                component: "multiLookup",
                filterType: "array",
                collapsible: true,
                data: packagingTypesWithCount
            },
           
            {
                name: "priceTerms",
                displayName: "Price Terms",
                component: "multiLookup",
                filterType: "array",
                collapsible: false,
                data: priceTermsWithCount
            }
        ];

        const filterTop = [
            {
                name: "countryOfOrigin",
                displayName: "Country",
                component: "multiLookup",
                filterType: "array",
                collapsible: true,
                data: countriesWithCount
            },
            {
                name: "uom",
                displayName: "UOM",
                component: "multiLookup",
                filterType: "array",
                collapsible: true,
                data: uomsWithCount
            },
            {
                name: 'recyclable',
                displayName: 'Recyclable',
                component: "lookup",
                filterType: "boolean",
                collapsible: true,
                data: recyclableWithCount
            },
            {
                name: 'bioDegradable',
                displayName: 'Bio Degradable',
                component: "lookup",
                filterType: "boolean",
                collapsible: true,
                data: bioDegradableWithCount
            },
            {
                name: 'fdaApproved',
                displayName: 'FDA Approved',
                component: "lookup",
                filterType: "boolean",
                collapsible: true,
                data: fdaApprovedWithCount
            },
            {
                name: 'medicalGrade',
                displayName: 'Medical Grade Certified',
                component: "lookup",
                filterType: "boolean",
                collapsible: true,
                data: medicalGradeWithCount
            },
        ];

        res.status(200).json({ 
            filterSide, 
            filterTop 
        });
    } catch (error) {
        console.error("Error fetching product filters:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default productFilter;