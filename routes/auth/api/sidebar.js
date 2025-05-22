import express from "express";
import User from "../../../models/user.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const userSidebar = express.Router();

userSidebar.get("", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const userInfo = await User.findById(userId);
    if (!userInfo) {
      return res.status(404).json({ message: "User not found" });
    }

    let sidebarItems = [
      {
        displayName: "Profile",
        route: "/profile",
        name: "profile",
        icon: "profileIcon.svg",
      },
      {
        displayName: "Settings",
        route: "/settings",
        name: "settings",
        icon: "settingsIcon.svg",
      },
      {
        displayName: "Privacy Pollicy",
        route: "/privacyPolicy",
        name: "privacyPolicy",
        icon: "privacyPolicyIcon.svg",
      },
      {
        displayName: "Terms & Conditions",
        route: "/termsAndCondition",
        name: "termsAndCondition",
        icon: "termsAndConditionIcon.svg",
      },
    ];

    if (userInfo.user_type === "expert") {
      sidebarItems.push({
        displayName: "Message",
        route: "/message",
        name: "message",
        icon: "messageIcon.svg",
      });
    } else if (userInfo.user_type === "seller") {
      sidebarItems.push(
        {
          displayName: "Product",
          route: "/product",
          name: "product",
          icon: "productIcon.svg",
        },
        {
          displayName: "Enquiries",
          route: "/enquiries",
          name: "enquiries",
          icon: "enquiriesIcon.svg",
          subItems: [
            {
              displayName: "Sample Request",
              route: "/sample-request",
              name: "sample-request",
              icon: "sampleIcon.svg",
            },
            {
              displayName: "Quote Request",
              route: "/quote-request",
              name: "quote-request",
              icon: "quoteIcon.svg",
            },
          ],
        },
        {
          displayName: "Experts",
          route: "/experts",
          name: "experts",
          icon: "expertsIcon.svg",
        }
      );
    } else if (userInfo.user_type === "buyer") {
      sidebarItems.push({
        displayName: "Enquiries",
        route: "/enquiries",
        name: "enquiries",
        icon: "enquiriesIcon.svg",
        subItems: [
          {
            displayName: "Sample Request",
            route: "/sample-request",
            name: "sample-request",
            icon: "sampleIcon.svg",
          },
          {
            displayName: "Quote Request",
            route: "/quote-request",
            name: "quote-request",
            icon: "quoteIcon.svg",
          },
          {
            displayName: "Finance Request",
            route: "/finance-request",
            name: "finance-request",
            icon: "financeIcon.svg",
          },
        ],
      });
    }

    res.status(200).json({ data: sidebarItems });
  } catch (error) {
    console.error("Sidebar Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default userSidebar;
