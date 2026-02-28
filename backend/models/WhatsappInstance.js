import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const WhatsappInstance = sequelize.define(
  "WhatsappInstance",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    instanceName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assistantRole: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Atendimento Geral",
    },
    status: {
      type: DataTypes.ENUM(
        "disconnected",
        "connecting",
        "connected",
        "error",
        "expired",
      ),
      defaultValue: "disconnected",
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: true, // Integration token with Evolution API
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    planLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 1, // Qtd de instâncias que o plano permitr. Para Evolution vamos lidar com limites
    },
  },
  {
    timestamps: true,
    tableName: "WhatsappInstances",
  },
);

export default WhatsappInstance;
