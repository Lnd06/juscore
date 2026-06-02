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
  comarca: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fase: {
    type: DataTypes.ENUM("Conhecimento", "Execução", "Recurso", "Arquivado"),
    defaultValue: "Conhecimento",
  },
  dataCitacao: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  probabilidadeExito: {
    type: DataTypes.ENUM("Alta", "Media", "Baixa"),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("ativo", "suspenso", "encerrado"),
    defaultValue: "ativo",
  },
  partes: {
    type: DataTypes.TEXT,
    comment:
      "JSON string com as partes envolvidas ('autor', 'reu', 'advogados')",
    get() {
      const rawValue = this.getDataValue("partes");
      try {
        return JSON.parse(rawValue || "{}");
      } catch {
        return {};
      }
    },
    set(value) {
      if (typeof value === "object") {
        this.setDataValue("partes", JSON.stringify(value));
      } else {
        this.setDataValue("partes", value);
      }
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
  lastMovement: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  aiSummary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  nextSteps: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default Process;
