// lawyerController.js
const { User, Role, LawyerTags, Tags, sequelize } = require("../../models");

const getUsersByRole = async (req, res) => {
  try {
    const { role_id } = req.query;

    if (!role_id) {
      return res.status(400).json({
        message: "Role ID is required in the request query parameters",
      });
    }

    const users = await User.findAll({
      where: { role_id },
      attributes: ["id", "first_name", "email"],
      include: [
        {
          model: Role,
          as: "role",
          where: { id: role_id },
          attributes : ['name']
        },

        {
          model: Tags,
          as: "lawyerTags",
          attributes: ["name", "description"],
          through: { attributes: [] },
        },
      ],
    });

    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found with the specified role_id" });
    }

    return res.status(200).json({
      message: "Users found successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getUsersByRole,
};
