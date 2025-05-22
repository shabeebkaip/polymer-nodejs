import express from "express";
import bcrypt from "bcrypt";
import User from "../../../models/user.js";
import Auth from "../../../models/auth.js";
import { accountCreationMail } from "../../../tools/mail.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import generateRandomId from "../../../common/random.js";

const expertCreate = express.Router();

expertCreate.post("", authenticateUser, async (req, res) => {
  try {
    const sellerId = req.user.id;

    const seller = await User.findById(sellerId);
    if (!seller || seller.user_type !== "seller") {
      return res.status(403).json({ message: "Only sellers can create experts." });
    }

    const {
      firstName,
      lastName,
      email,
      country_code,
      phone,
      Expert_department,
      Expert_role,
      profile_image,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Expert already exists with this email." });
    }

    const expertUser = new User({
      firstName,
      lastName,
      email,
      company: seller.company,
      website: seller.website,
      industry: seller.industry,
      address: seller.address,
      country_code,
      phone,
      Expert_department,
      Expert_role,
      profile_image,
      location: seller.location,
      vat_number: seller.vat_number,
      company_logo: seller.company_logo,
      user_type: "expert",
      verification: "pending",
      sellerId: seller._id,
    });

    await expertUser.save();

    const companyPrefix = (seller.company || "CO").substring(0, 2).toUpperCase();
    const randomSuffix = generateRandomId(6); 
    const password = `${companyPrefix}${randomSuffix}`; 

    const hashedPassword = await bcrypt.hash(password, 10);
    const authEntry = new Auth({
      email,
      password: hashedPassword,
      userId: expertUser._id,
    });
    await authEntry.save();

    accountCreationMail(firstName, email, password);

    res.status(201).json({ message: "Expert created successfully and email sent." });

  } catch (error) {
    console.error("Create Expert Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default expertCreate;
