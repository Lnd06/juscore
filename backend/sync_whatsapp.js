import sequelize from "./config/database.js";
import WhatsappInstance from "./models/WhatsappInstance.js";

const syncDb = async () => {
  try {
    await sequelize.authenticate();
    await WhatsappInstance.sync({ alter: true });
    console.log("WhatsappInstance table altered successfully with new fields.");
  } catch (error) {
    console.error("Error syncing db:", error);
  } finally {
    process.exit();
  }
};

syncDb();
