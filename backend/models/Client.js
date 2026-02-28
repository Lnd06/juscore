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
  endereco: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default Client;
