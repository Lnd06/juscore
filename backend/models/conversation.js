import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Conversation = sequelize.define("Conversation", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  titulo: {
    type: DataTypes.STRING,
    defaultValue: "Nova Conversa",
  },
  mensagens: {
    type: DataTypes.TEXT("long"),
    // defaultValue removido
    get() {
      const rawValue = this.getDataValue("mensagens");
      try {
        return JSON.parse(rawValue || "[]");
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue("mensagens", JSON.stringify(value));
    },
  },
  flagged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  flagReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  topic: {
    type: DataTypes.STRING,
    defaultValue: "Geral",
  },
  sentiment: {
    type: DataTypes.STRING,
    defaultValue: "Neutro",
  },
});

export default Conversation;
