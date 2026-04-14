import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const FinancialTransaction = sequelize.define("FinancialTransaction", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Advogado/Dono da transação",
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Cliente vinculado (se houver)",
  },
  processId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Processo vinculado (se houver)",
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Ex: Honorários Iniciais, Custas, Aluguel",
  },
  tipo: {
    type: DataTypes.ENUM("RECEITA", "DESPESA"),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.STRING,
    defaultValue: "Honorários",
    comment: "Categoria livre, ex: Honorários, Material, Transporte",
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("PENDENTE", "PAGO", "ATRASADO", "CANCELADO"),
    defaultValue: "PENDENTE",
  },
  dataVencimento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  dataPagamento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  formaPagamento: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Pix, Boleto, Cartão, Dinheiro",
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default FinancialTransaction;
