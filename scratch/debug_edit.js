import sequelize from "../backend/config/database.js";

(async () => {
  try {
    const [users] = await sequelize.query(
      "SELECT id, nome, email, tipo, cargo, parentUserId FROM Users;"
    );
    console.log("=== USERS IN DATABASE ===");
    console.log(users);
    process.exit(0);
  } catch (error) {
    console.error("Error querying database:", error);
    process.exit(1);
  }
})();
