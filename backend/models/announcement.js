import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Announcement = sequelize.define(
  "Announcement",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    targetType: {
      type: DataTypes.ENUM("all", "plan", "user"),
      allowNull: false,
      defaultValue: "all",
    },
    targetValue: {
      type: DataTypes.STRING,
      allowNull: true,
      comment:
        "Can be a plan string ('student_basic') or user email/id when targetType is 'plan' or 'user'",
    },
    type: {
      type: DataTypes.ENUM("info", "warning", "success", "error"),
      allowNull: false,
      defaultValue: "info",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
  },
);

export default Announcement;
