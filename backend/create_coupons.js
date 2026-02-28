import { Coupon } from "./models/index.js";
import sequelize from "./config/database.js";

async function createCoupons() {
  try {
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida.");

    // Remove if exists to avoid errors on multiple runs
    await Coupon.destroy({ where: { code: ["JUSCORE20", "BETA50"] } });

    await Coupon.create({
      code: "JUSCORE20",
      type: "PERCENTAGE",
      value: 20, // 20%
      isActive: true,
    });

    await Coupon.create({
      code: "BETA50",
      type: "FIXED",
      value: 50, // R$ 50
      isActive: true,
    });

    console.log(
      "✅ Cupons criados com sucesso: JUSCORE20 (20%) e BETA50 (R$ 50)",
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao criar cupons:", error);
    process.exit(1);
  }
}

createCoupons();
