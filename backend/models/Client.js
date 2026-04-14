import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Client = sequelize.define("Client", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Advogado/Dono responsável",
  },
  tipoPessoa: {
    type: DataTypes.ENUM("Física", "Jurídica"),
    defaultValue: "Física",
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cpf_cnpj: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rg: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estadoCivil: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profissao: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cep: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  endereco: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cidade: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.STRING(2),
    allowNull: true,
  },
  dadosBancarios: {
    type: DataTypes.TEXT,
    comment: "JSON string com banco, agencia, conta",
    get() {
      const rawValue = this.getDataValue("dadosBancarios");
      try {
        return JSON.parse(rawValue || "{}");
      } catch {
        return {};
      }
    },
    set(value) {
      if (typeof value === "object") {
        this.setDataValue("dadosBancarios", JSON.stringify(value));
      } else {
        this.setDataValue("dadosBancarios", value);
      }
    },
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default Client;
