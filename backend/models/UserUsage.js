import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const UserUsage = sequelize.define(
  "UserUsage",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // Only 1 active row per user
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Track the current day
    },
    dailyConversations: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    dailyCalculations: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    dailyDocuments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    dailyVision: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Method to verify and reset daily limits if the date has changed
UserUsage.prototype.checkAndReset = async function () {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // If the record date is older than today, reset it
  if (this.date !== today) {
    this.date = today;
    this.dailyConversations = 0;
    this.dailyCalculations = 0;
    this.dailyDocuments = 0;
    this.dailyVision = 0;
    await this.save();
  }
};

export default UserUsage;
