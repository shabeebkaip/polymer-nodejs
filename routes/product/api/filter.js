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

const productFilter = express.Router();

productFilter.get('/', async (req, res) => {
    try {
        const [
            chemicalfamilies,
            polymertypes,
            industries,
            grades,
            physicalForms,
            incoterms,
            paymentTerms,
            packagingTypes,
            users
        ] = await Promise.all([
            ChemicalFamily.find({}, { name: 1 }).lean(),
            PolymerType.find({}, { name: 1 }).lean(),
            Industry.find({}, { name: 1 }).lean(),
            Grade.find({}, { name: 1 }).lean(),
            PhysicalForm.find({}, { name: 1 }).lean(),
            Incoterm.find({}, { name: 1 }).lean(),
            PaymentTerms.find({}, { name: 1 }).lean(),
            PackagingType.find({}, { name: 1 }).lean(),
            User.find({ user_type: 'seller' }, { firstName: 1, lastName: 1 }).lean() 
        ]);


        const usersWithFullName = users.map(user => ({
            _id: user._id,
            name: `${user.firstName} ${user.lastName}`  
        }));

    
        const countries = await Product.distinct('countryOfOrigin');
        const uoms = await Product.distinct('uom');
        const priceTerms = ['fixed', 'negotiable']; 

        
        const filter = [
            {
                name: "chemicalFamily",
                displayName: "Chemical Family",
                component: "multiLookup",
                filterType:"array",
                data: chemicalfamilies
            },
            {
                name: "polymerType",
                displayName: "Polymer Type",
                component: "multiLookup",
                filterType:"array",
                data: polymertypes
            },
            {
                name: "industry",
                displayName: "Industry Application",
                component: "multiLookup",
                filterType:"array",
                data: industries
            },
            {
                name: "grade",
                displayName: "Application Grade",
                component: "multiLookup",
                filterType:"array",
                data: grades
            },
            {
                name: "physicalForm",
                displayName: "Physical Form",
                component: "multiLookup",
                filterType:"array",
                data: physicalForms
            },
            {
                name: "countryOfOrigin",
                displayName: "Country of Origin",
                component: "multiLookup",
                filterType:"array",
                data: countries
            },
            {
                name: "uom",
                displayName: "Unit of Measure (UOM)",
                component: "multiLookup",
                filterType:"array",
                data: uoms
            },
            {
                name: "priceTerms",
                displayName: "Price Terms",
                component: "multiLookup",
                filterType:"array",
                data: priceTerms
            },
            {
                name: "incoterms",
                displayName: "Incoterms",
                component: "multiLookup",
                filterType:"array",
                data: incoterms
            },
            {
                name: "paymentTerms",
                displayName: "Payment Terms",
                component: "multiLookup",
                filterType:"array",
                data: paymentTerms
            },
            {
                name: "packagingType",
                displayName: "Packaging Type",
                component: "multiLookup",
                filterType:"array",
                data: packagingTypes
            },
            {
                name: 'recyclable',
                displayName: 'Recyclable',
                component: "lookup",
                filterType:"boolean",
                data: [true, false]
            },
            {
                name: 'bioDegradable',
                displayName: 'Biodegradable',
                component: "lookup",
                filterType:"boolean",
                data: [true, false]
            },
            {
                name: 'fdaApproved',
                displayName: 'FDA Approved',
                component: "lookup",
                filterType:"boolean",
                data: [true, false]
            },
            {
                name: 'medicalGrade',
                displayName: 'Medical Grade Certified',
                component: "lookup",
                filterType:"boolean",
                data: [true, false]
            },
            {
                name: "createdBy",
                displayName: "Created By",
                component: "multiLookup",
                filterType:"array",
                data: usersWithFullName
            }
        ];

        res.status(200).json({ filter });
    } catch (error) {
        console.error("Error fetching product filters:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default productFilter;
