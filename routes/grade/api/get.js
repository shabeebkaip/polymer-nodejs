import express from "express";
import Grade from "../../../models/grade.js";

const getGrade = express.Router();

getGrade.get("", async (req, res) => {
  try {
    const grades = await Grade.find({});
    res.status(200).json({
      message: "Grades fetched successfully",
      success: true,
      statusCode: 200,
      data: grades,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error fetching grades", error);
  }
});

export default getGrade;
