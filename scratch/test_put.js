import { User } from "../backend/models/index.js";

(async () => {
  try {
    const targetUserId = 173;
    const ownerId = 1;
    const nome = "kleber";
    const tipo = "admin";

    console.log("1. Finding user...");
    const target = await User.findOne({
      where: { id: targetUserId, parentUserId: ownerId },
    });

    if (!target) {
      console.log("❌ User not found!");
      process.exit(1);
    }

    console.log("User found:", target.nome, "with current tipo:", target.tipo);

    console.log("2. Updating fields...");
    target.nome = nome;
    target.tipo = tipo;

    console.log("3. Saving target...");
    await target.save();
    console.log("✅ Success! Target saved successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during target.save():", error);
    process.exit(1);
  }
})();
