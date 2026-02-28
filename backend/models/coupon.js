import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Coupon = sequelize.define("Coupon", {
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.ENUM("PERCENTAGE", "FIXED"),
    allowNull: false,
  },
  value: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  targetType: {
    type: DataTypes.ENUM("ALL", "NEW", "USER"),
    defaultValue: "ALL",
  },
  targetUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  maxUses: {
    type: DataTypes.INTEGER,
    defaultValue: -1, // -1 = Unlimited
  },
  usedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  allowedPlans: {
    type: DataTypes.JSON, // Use JSON array e.g. ["student_pro", "office_master"]
    allowNull: true,
  },
});

export default Coupon;
