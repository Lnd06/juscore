import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Fee = sequelize.define("Fee", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  processId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Ex: Honorários Iniciais, Consulta, etc.",
  },
  valorTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pendente", "pago", "atrasado", "cancelado"),
    defaultValue: "pendente",
  },
  vencimento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  dataPagamento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
});

export default Fee;
