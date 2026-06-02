import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["senha"] }, // Sequelize syntax for excluding fields
    });

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
};

export const authEspecial = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      const allowedRoles = [
        "especial",
        "admin",
        "master",
        "office_master",
        "enterprise",
      ];
      if (!allowedRoles.includes(req.user.tipo)) {
        return res
          .status(403)
          .json({ error: "Acesso restrito a usuários especiais" });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ error: "Autenticação falhou" });
  }
};

export const authAdmin = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      const allowedRoles = ["admin", "master", "office_master", "enterprise"];
      if (!allowedRoles.includes(req.user.tipo)) {
        return res
          .status(403)
          .json({ error: "Acesso restrito a administradores" });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ error: "Autenticação falhou" });
  }
};

export const authMaster = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      const allowedRoles = ["master", "office_master", "enterprise"];
      if (!allowedRoles.includes(req.user.tipo)) {
        return res
          .status(403)
          .json({ error: "Acesso restrito a usuários Master" });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ error: "Autenticação falhou" });
  }
};
