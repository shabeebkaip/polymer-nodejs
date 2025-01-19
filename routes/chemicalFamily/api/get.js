import express from "express";
import ChemicalFamily from "../../../models/chemicalFamily.js";

const chemicalFamilyGet = express.Router();

chemicalFamilyGet.get('', async (req, res) => {
    try {
      const chemical = await ChemicalFamily.find({})
      
      const result = {
        tableHeader: [
          { name: "name", displayName: "Category" },
          { name: "image", displayName: "image" },
          { name: "edit", displayName: "" },
          { name: "delete", displayName: "" },
    
        ],
        // checkbox: true,
        // breadcrumb: true,
       
        components: [
          { name: "name", displayName: "Category", component: "text" },
          { name: "image", displayName: "Icon", component: "image" },
          { name: "edit", displayName: "Edit", component: "action" },
          { name: "delete", displayName: "Delete", component: "action" },
        ],
        data: []
      }
      const tools = [
        {
          name: "create",
          displayName:"ADD CHEMICAL FAMILY",
          icon: "create.svg",
          bgColor: "#0D47A1",
          txtColor: "#FFFFFF",
        },
      ];
  
      if (chemical ) {
        chemical .forEach((chemical ) => {
          const row = {}
          row.id = chemical._id
          row.name = chemical.name
          row.image = chemical.image
          row.edit = { name: "edit", icon: "edit.svg", displayName: "Edit", id: chemical._id }
          row.delete = { name: "delete", icon: "delete.svg", displayName: "Delete", id: chemical._id }
          result.data.push(row)
        })
        res.status(200).send({status:true, result, tools })
  
      } else {
        res.status(200).send({ status:false, message: 'No data' })
      }
  
    } catch (error) {
      console.log(error);
  
      res.status(500).json({
        status:false,
        message: "Internal server error",
      });
    }
  });

export default chemicalFamilyGet;