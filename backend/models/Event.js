import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Event = sequelize.define("Event", {
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
    comment: "Processo vinculado ao prazo/evento",
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM("prazo", "audiencia", "reuniao", "tarefa"),
    defaultValue: "tarefa",
  },
  dataHora: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  lembrete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  concluido: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  googleEventId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

export default Event;
