import express from "express";
import User from "../../../models/user.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const userEdit = express.Router();

userEdit.put("/", authenticateUser, async (req, res) => {
    try {
      const id = req.user?.id;
  
      const {
        firstName,
        lastName,
        company,
        website,
        country_code,
        phone,
        industry,
        address,
        location,
        vat_number,
        company_logo,
        user_type,
        email
      } = req.body;
  
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }
  
      if ("email" in req.body && req.body.email !== existingUser.email) {
        return res.status(400).json({
          status: false,
          message: "Email cannot be changed",
        });
      }
  
      const finalUserType = user_type || existingUser.user_type;
  
      if (!firstName || !lastName || !company || !website || !phone) {
        return res.status(400).json({
          status: false,
          message: "Missing required fields",
        });
      }
  
      if (finalUserType === "seller" && (!vat_number || !company_logo)) {
        return res.status(400).json({
          status: false,
          message: "VAT number and company logo are required for sellers",
        });
      }
  
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.company = company;
      existingUser.website = website;
      existingUser.country_code = country_code;
      existingUser.phone = phone;
      existingUser.industry = industry;
      existingUser.address = address;
      existingUser.location = location;
  
      existingUser.vat_number = finalUserType === "seller" ? vat_number : vat_number || undefined;
      existingUser.company_logo = finalUserType === "seller" ? company_logo : company_logo || undefined;
      existingUser.user_type = finalUserType;
  
      await existingUser.save();
  
      res.status(200).json({
        status: true,
        message: "Profile updated successfully",
        userInfo: existingUser,
      });
  
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  });
  

export default userEdit;
