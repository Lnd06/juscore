import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Process = sequelize.define("Process", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Cliente vinculado ao processo",
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tribunal: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  vara: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "ativo",
  },
  partes: {
    type: DataTypes.TEXT,
    comment: "JSON string com as partes envolvidas",
    get() {
      const rawValue = this.getDataValue("partes");
      try {
        return JSON.parse(rawValue || "{}");
      } catch {
        return {};
      }
    },
    set(value) {
      this.setDataValue("partes", JSON.stringify(value));
    },
  },
  valorCausa: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  dataDistribuicao: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default Process;
