import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Setting = sequelize.define("Setting", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default Setting;
