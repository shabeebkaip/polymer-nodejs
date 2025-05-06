import express from "express";
import Grade from "../../../models/grade.js";

const createGrade = express.Router();

createGrade.post("", async (req, res) => {
  try {
    const newGrade = new Grade(req.body);
    await newGrade.save();
    res.status(200).json({
      message: "Grade created successfully",
      status: true,
      data: newGrade,
    });
  } catch (error) {
    console.log("Error creating grade", error);
  }
});

export default createGrade;
