import { User } from "../models/index.js";
import sequelize from "../config/database.js";

const promoteToMaster = async (email) => {
  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.error(`❌ Usuário com email ${email} não encontrado.`);
      return;
    }

    user.tipo = "master";
    await user.save();
    console.log(
      `✅ Usuário ${user.nome} (${email}) promovido para Master com sucesso!`,
    );
  } catch (error) {
    console.error("❌ Erro ao promover usuário:", error);
  } finally {
    await sequelize.close();
  }
};

const email = process.argv[2];

if (!email) {
  console.log("⚠️ Uso: node scripts/promote_master.js <email_do_usuario>");
  process.exit(1);
}

promoteToMaster(email);
