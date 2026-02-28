import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const KnowledgeBase = sequelize.define("KnowledgeBase", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT("long"),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("book", "article", "document"),
    defaultValue: "book",
  },
  categoria: {
    type: DataTypes.ENUM("GERAL", "OAB", "TCC", "DOCUMENTOS"),
    defaultValue: "GERAL",
    allowNull: false,
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

export default KnowledgeBase;
