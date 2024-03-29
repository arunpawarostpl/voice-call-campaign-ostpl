import mongoose from "mongoose";
import CallingNumber from "../models/dniModel.js";
import { verifyToken } from "../validator/authService.js";

// Create a new calling number
const createCallingNumber = async (req, res) => {
  try {
    const token = req.headers.authorization;
    console.log("token", token);
    const { UserId } = verifyToken(token);
    const { mobileNumber } = req.body;
    if (!UserId) {
      return console.console.log("error");
    }
    const number = mobileNumber;
    const newCallingNumber = new CallingNumber({ number });
    const savedCallingNumber = await newCallingNumber.save();
    res.status(201).json(savedCallingNumber);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all calling numbers
const getAllCallingNumbers = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { UserId } = verifyToken(token);

    console.log("token", token);
    if (!UserId) {
      return console.console.log("error");
    }
    const callingNumbers = await CallingNumber.find();
    console.log(callingNumbers);
    res.json(callingNumbers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const uploadDni = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { UserRole, UserId } = verifyToken(token);
    const numberBuffer = req.files["numberFile"][0];
    const csvBuffer = numberBuffer.buffer;
    const csvString = csvBuffer.toString("utf-8");
    const phoneNumbers = csvString

      .split("\n")
      .map((row) => row.trim())
      .filter((row) => row !== "" && row !== "Numbers");
      const cleanAndValidatePhoneNumber = (number) => {
          const cleanedNumber = number.replace(/[^0-9]/g, "");
          const mobileNumberRegex = /^[6-9]\d{9}$/;
          return mobileNumberRegex.test(cleanedNumber) ? cleanedNumber : null;
        };
        const validNumbers = phoneNumbers
        .map(cleanAndValidatePhoneNumber)
        .filter((number) => number !== null);
        
        console.log("number",validNumbers);
    const listNumber = await CallingNumber.find();
    console.log("listNumber",listNumber);

    //   const existingNumbers = listNumber.filter((number) => validNumbers.includes(number));
    const existingNumberSet = new Set(listNumber.map(item => item.number));
    const newNumberSet = new Set(validNumbers);
    const uniqueNumbers = [...newNumberSet].filter(number => !existingNumberSet.has(number));
    uniqueNumbers.forEach(async (number) => {
        const correspondingExistingNumber = listNumber.find(item => item.number === number);

        console.log("correspondingExistingNumber",correspondingExistingNumber);
        // Save to the database using your Mongoose model
        const savedNumber = await CallingNumber.create({ number });
        console.log(`Saved new number ${number} with _id ${savedNumber._id} corresponding to existing _id ${correspondingExistingNumber._id}`);
      });

  res.status(200).json({message:"Number added successfully"})
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update a calling number
const updateCallingNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const { number } = req.body;
    const updatedCallingNumber = await CallingNumber.findByIdAndUpdate(
      id,
      { number },
      { new: true }
    );
    res.json(updatedCallingNumber);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a calling number
const deleteCallingNumber = async (userId) => {
  try {
    // const objectIdUserId = mongoose.Types.ObjectId(userId);
    const result = await CallingNumber.findByIdAndDelete({_id:userId});
    console.log("result",result);
    if (result) {
      console.log("Calling number deleted successfully");
    } else {
      console.log("Calling number not found");
      // Handle the case where the calling number was not found
    }
  } catch (error) {
    console.error(error);
    // If you are using 'res' here, make sure to handle the response properly.
    // Otherwise, consider throwing the error or handling it in the calling function.
  }
};


export {
  createCallingNumber,
  getAllCallingNumbers,
  updateCallingNumber,
  deleteCallingNumber,
  uploadDni
};
