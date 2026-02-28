import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import bcrypt from "bcryptjs";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apelido: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cpf: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    telefone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tipo: {
      type: DataTypes.STRING,
      defaultValue: "comum",
    },
    foto: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    cargo: {
      type: DataTypes.STRING,
      allowNull: true, // Pode ser null para usuários antigos
    },
    finalidade: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    termosAceitos: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    dataAceiteTermos: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ultimasConversas: {
      type: DataTypes.TEXT,
      // defaultValue removido (MySQL não suporta default para TEXT)
      get() {
        const rawValue = this.getDataValue("ultimasConversas");
        try {
          return JSON.parse(rawValue || "[]");
        } catch {
          return [];
        }
      },
      set(value) {
        if (typeof value === "object") {
          this.setDataValue("ultimasConversas", JSON.stringify(value));
        } else {
          this.setDataValue("ultimasConversas", value);
        }
      },
    },
    // Subscription Fields (Mercado Pago)
    subscriptionStatus: {
      type: DataTypes.ENUM("active", "inactive", "pending", "cancelled"),
      defaultValue: "inactive",
    },
    subscriptionPlan: {
      type: DataTypes.STRING, // Alterado de ENUM para STRING para maior flexibilidade
      defaultValue: "free",
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parentUserId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Se for null, ele é o dono. Se tiver ID, ele é funcionário/membro da equipe daquele dono.
    },
    subscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subscriptionPrice: {
      type: DataTypes.FLOAT,
      allowNull: true, // Se null, usa o preço padrão do plano
    },
    cancelAtPeriodEnd: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    resetPasswordToken: DataTypes.STRING,
    resetPasswordExpires: DataTypes.DATE,
    // Google Integration
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    googleTokens: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Stored as JSON string",
    },
    // White Label
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Organizations",
        key: "id",
      },
    },
  },
  {
    hooks: {
      beforeCreate: async (user) => {
        if (user.senha) {
          user.senha = await bcrypt.hash(user.senha, 8);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("senha")) {
          user.senha = await bcrypt.hash(user.senha, 8);
        }
      },
    },
  },
);

User.prototype.compararSenha = async function (senha) {
  return await bcrypt.compare(senha, this.senha);
};

export default User;
