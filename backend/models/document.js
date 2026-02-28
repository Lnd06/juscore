import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Document = sequelize.define("Document", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM("modelo", "conhecimento"),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.ENUM(
      "contrato",
      "peticao",
      "parecer",
      "oficio",
      "memorando",
      "outro",
    ),
    allowNull: false,
  },
  conteudo: {
    type: DataTypes.TEXT("long"), // Conteúdo grande
    allowNull: false,
  },
  variaveis: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue("variaveis");
      try {
        return JSON.parse(rawValue || "[]");
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue("variaveis", JSON.stringify(value));
    },
  },
  arquivoPDF: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue("arquivoPDF");
      try {
        return rawValue ? JSON.parse(rawValue) : null;
      } catch {
        return null;
      }
    },
    set(value) {
      if (value) this.setDataValue("arquivoPDF", JSON.stringify(value));
    },
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

export default Document;
