import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Feedback = sequelize.define("Feedback", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("BUG", "SUGGESTION", "OTHER"),
    allowNull: false,
    defaultValue: "SUGGESTION",
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("OPEN", "IN_PROGRESS", "RESOLVED"),
    defaultValue: "OPEN",
  },
});

export default Feedback;
