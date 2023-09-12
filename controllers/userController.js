const { Users, removedUsers } = require("../models");
const { Op } = require("sequelize");
require("dotenv").config();

//get all user details
const getAllUsers = async (req, res) => {
  try {
    const listOfUsers = await Users.findAll({});
    res.json(listOfUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//get specific user
const getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(404).json({ error: "Missing Credentials" });
    const user = await Users.findOne({
      where: { userId },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ message: "User  Retrieved successfully", user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//create user
const createUser = async (req, res) => {
  const { FirstName, LastName, Email, PhoneNumber } = req.body;
  try {
    if (!FirstName || !LastName || !Email || !PhoneNumber)
      return res.status(404).json({ error: "Missing Credentials" });

    //check if email is already registered
    const existingEmail = await Users.findOne({
      where: { Email: Email },
    });

    //check if Phone Number is already registered
    const existingPhone = await Users.findOne({
      where: { PhoneNumber: PhoneNumber },
    });

    if (existingEmail && existingPhone)
      return res
        .status(400)
        .json({ error: "Email and Phone Number already registered" });
    if (existingEmail)
      return res.status(400).json({ error: "Email already registered" });
    if (existingPhone)
      return res.status(400).json({ error: "Phone Number already registered" });

    //check if user was deleted previously based on email or phone number
    const existingRemovedUser = await removedUsers.findOne({
      where: {
        [Op.or]: [{ Email }, { PhoneNumber }],
      },
    });

    if (existingRemovedUser) {
      // Remove the user from RemovedUsers if found
      await removedUsers.destroy({
        where: {
          [Op.or]: [{ Email }, { PhoneNumber }],
        },
      });
    }

    //create user
    const user = await Users.create({
      FirstName,
      LastName,
      Email,
      PhoneNumber,
    });
    return res.status(201).json({ message: "User created Successfully", user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//update user details
const updateUser = async (req, res) => {
  const { userId, FirstName, LastName, Email, PhoneNumber } = req.body;

  try {
    if (!userId) return res.status(404).json({ error: "user Id is required" });

    // Check if the user exists
    const user = await Users.findOne({
      where: { userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if Email or PhoneNumber are already registered by other users
    if (Email) {
      const existingEmail = await Users.findOne({
        where: { Email, userId: { [Op.ne]: userId } }, // Exclude the current user from the search
      });

      if (existingEmail) {
        return res
          .status(400)
          .json({ error: "Email already registered by another user" });
      }
    }

    if (PhoneNumber) {
      const existingPhone = await Users.findOne({
        where: { PhoneNumber, userId: { [Op.ne]: userId } }, // Exclude the current user from the search
      });

      if (existingPhone) {
        return res
          .status(400)
          .json({ error: "Phone Number already registered by another user" });
      }
    }

    // Create an object with the fields to be updated
    const updatedFields = {};
    if (FirstName) updatedFields.FirstName = FirstName;
    if (LastName) updatedFields.LastName = LastName;
    if (Email) updatedFields.Email = Email;
    if (PhoneNumber) updatedFields.PhoneNumber = PhoneNumber;

    // Update user details
    await Users.update(updatedFields, {
      where: { userId },
    });

    const updatedUser = await Users.findOne({
      where: { userId },
    });

    return res
      .status(200)
      .json({ message: "User details updated successfully", updatedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//delete a user (move to removed User table)
const deleteUser = async (req, res) => {
  const { userId } = req.body;

  try {
    if (!userId) return res.status(404).json({ error: "User Id is required" });

    const user = await Users.findOne({
      where: { userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user has current orders
    const response = await fetch(
      `${process.env.ORDERS_API}/check/user/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const responseData = await response.json();

    if (response.status !== 200) {
      return res.status(response.status).json({ error: responseData.error });
    }

    const { hasCurrentOrders, orderIds } = responseData;

    if (hasCurrentOrders) {
      return res
        .status(400)
        .json({ error: "Failed! ,User has pending orders", orderIds });
    }

    const removedUserData = { ...user.toJSON() };

    await Users.destroy({
      where: { userId },
    });

    await removedUsers.create(removedUserData);

    return res.status(200).json({ message: "User removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
