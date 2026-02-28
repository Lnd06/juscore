import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Organization = sequelize.define(
  "Organization",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    logoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    primaryColor: {
      type: DataTypes.STRING,
      defaultValue: "#D4AF37", // Default Gold
    },
    secondaryColor: {
      type: DataTypes.STRING,
      defaultValue: "#0f172a", // Default Dark
    },
    sidebarColor: {
      type: DataTypes.STRING,
      defaultValue: "#ffffff", // Default White (matched with Sidebar.jsx)
    },
    accentColor: {
      type: DataTypes.STRING,
      defaultValue: "#2563EB", // Default Action Blue
    },
    backgroundColor: {
      type: DataTypes.STRING,
      defaultValue: "#ffffff", // Default White
    },
    borderColor: {
      type: DataTypes.STRING,
      defaultValue: "#e2e8f0", // Default Slate 200
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    faviconUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    supportEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    supportWhatsapp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dashboardWelcome: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    footerText: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  },
);

export default Organization;
