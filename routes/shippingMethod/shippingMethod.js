import express from "express";
import createShippingMethod from "./api/createShipping.js";
import getShippingMethod from "./api/getShipping.js";
import updateShippingMethod from "./api/updateShipping.js";
import deleteShippingMethod from "./api/deleteShipping.js";


const shippingMethodRouter = express.Router()

shippingMethodRouter.use("/create", createShippingMethod);
shippingMethodRouter.use("/list", getShippingMethod);
shippingMethodRouter.use("/edit", updateShippingMethod);
shippingMethodRouter.use("/delete", deleteShippingMethod);


export default shippingMethodRouter;
