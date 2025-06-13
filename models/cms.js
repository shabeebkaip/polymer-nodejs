import mongoose from "mongoose";

const schema = new mongoose.Schema({
    section: {
        type: String,
        required: true,
        enum: ['socialMedia', 'termsAndConditions', 'privacyPolicy',"BenefitsForBuyer","BenefitsForSuplier", "HeroSection", "PolymerAdvantages", "FooterMailNumber"],
    },
    content: {
        type: mongoose.Schema.Types.Mixed, 
        required: true,
    }
})

// schema.pre('save', function (next) {
//     if (Array.isArray(this.content)) {
//       this.content.forEach(item => {
//         if (!item._id) {
//             item._id = generateRandomId(); 
//         }
//         });
//     }
//     next();
// });
// schema.index({section:1})

const Cms = mongoose.model('cms', schema);

export default Cms;
