import sequelize from "./config/database.js";
import { User } from "./models/index.js";

const listUsers = async () => {
  try {
    await sequelize.authenticate();
    const users = await User.findAll({
      attributes: ["id", "nome", "email", "tipo"],
    });
    console.table(users.map((u) => u.toJSON()));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
};

listUsers();
