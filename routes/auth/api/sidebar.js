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
        route: "/user/profile",
        name: "profile",
        icon: "User",
      },
    ];

    if (userInfo.user_type === "expert") {
      sidebarItems.push({
        displayName: "Message",
        route: "/user/message",
        name: "message",
        icon: "MessageCircle",
      });
    } else if (userInfo.user_type === "seller") {
      sidebarItems.push(
        {
          displayName: "Product",
          route: "/user/product",
          name: "product",
          icon: "Package",
        },
        {
          displayName: "Procurement",
          route: "/enquiries",
          name: "enquiries",
          icon: "ClipboardList",
          subItems: [
            {
              displayName: "Sample Request Enquiries",
              route: "/user/sample-enquiries",
              name: "sample-request-enquiries",
              icon: "Flask",
            },
            {
              displayName: "Quote Request Enquiries",
              route: "/user/quote-enquiries",
              name: "quote-request-enquiries",
              icon: "DollarSign",
            },
          ],
        },
        {
          displayName: "Experts",
          route: "/user/experts",
          name: "experts",
          icon: "Users",
        },
        {
          displayName: "Analytics",
          route: "/user/analytics",
          name: "analytics",
          icon: "TrendingUp",
        },
        {
          displayName: "Orders",
          route: "/user/orders",
          name: "orders",
          icon: "ShoppingBag",
        }
      );
    } else if (userInfo.user_type === "buyer") {
      sidebarItems.push({
        displayName: "Procurement",
        route: "/procurement",
        name: "procurement",
        icon: "ClipboardList",
        subItems: [
          {
            displayName: "Sample Request",
            route: "/user/sample-requests",
            name: "sample-request",
            icon: "Flask",
          },
          {
            displayName: "Quote Request",
            route: "/user/quote-requests",
            name: "quote-request",
            icon: "DollarSign",
          },
          {
            displayName: "Finance Request",
            route: "/user/finance-requests",
            name: "finance-request",
            icon: "CreditCard",
          },
          {
            displayName: "Product Requests History",
            route: "/user/product-requests-history",
            name: "open-requests",
            icon: "Truck",
          },
        ],
      });
    }

    // Add common items for all user types
    sidebarItems.push(
      {
        displayName: "Settings",
        route: "/user/settings",
        name: "settings",
        icon: "Settings",
      },
      {
        displayName: "Privacy Policy",
        route: "/privacy-policy",
        name: "privacyPolicy",
        icon: "ShieldCheck",
      },
      {
        displayName: "Terms & Conditions",
        route: "/terms-and-Condition",
        name: "termsAndCondition",
        icon: "FileText",
      },
      {
        displayName: "Dashboard",
        route: "/user/dashboard",
        name: "dashboard",
        icon: "LayoutDashboard",
      },
      {
        displayName: "Notifications",
        route: "/user/notifications",
        name: "notifications",
        icon: "Bell",
      },
      {
        displayName: "Help & Support",
        route: "/user/support",
        name: "support",
        icon: "HelpCircle",
      }
    );

    

    res.status(200).json({ data: sidebarItems });
  } catch (error) {
    console.error("Sidebar Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default userSidebar;
