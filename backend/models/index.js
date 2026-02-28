import User from "./user.js";
import Conversation from "./conversation.js";
import Cache from "./cache.js";
import Document from "./document.js";
import Setting from "./setting.js";
import Coupon from "./coupon.js";
import WhatsappInstance from "./WhatsappInstance.js";
import KnowledgeBase from "./knowledgeBase.js";
import UserUsage from "./UserUsage.js";
import Client from "./Client.js";
import Process from "./Process.js";
import Event from "./Event.js";
import Fee from "./Fee.js";
import Organization from "./Organization.js";
import Feedback from "./feedback.js";
import Announcement from "./announcement.js";

// Associações
Organization.hasMany(User, { foreignKey: "organizationId", as: "users" });
User.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});
User.hasMany(Conversation, {
  as: "conversations",
  foreignKey: "userId",
  onDelete: "CASCADE",
});
Conversation.belongsTo(User, { foreignKey: "userId" });

User.hasOne(UserUsage, { foreignKey: "userId", onDelete: "CASCADE" });
UserUsage.belongsTo(User, { foreignKey: "userId" });

// Clientes e Processos
User.hasMany(Client, { foreignKey: "userId", as: "clients" });
Client.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Process, { foreignKey: "userId", as: "processes" });
Process.belongsTo(User, { foreignKey: "userId" });

Client.hasMany(Process, { foreignKey: "clientId", as: "processes" });
Process.belongsTo(Client, { foreignKey: "clientId" });

// Agenda (Eventos/Prazos)
User.hasMany(Event, { foreignKey: "userId", as: "events" });
Event.belongsTo(User, { foreignKey: "userId" });

Process.hasMany(Event, { foreignKey: "processId", as: "events" });
Event.belongsTo(Process, { foreignKey: "processId" });

// Financeiro (Honorários)
User.hasMany(Fee, { foreignKey: "userId", as: "fees" });
Fee.belongsTo(User, { foreignKey: "userId" });

Client.hasMany(Fee, { foreignKey: "clientId", as: "fees" });
Fee.belongsTo(Client, { foreignKey: "clientId" });

Process.hasMany(Fee, { foreignKey: "processId", as: "fees" });
Fee.belongsTo(Process, { foreignKey: "processId" });

// Whatsapp Instances (1:N)
User.hasMany(WhatsappInstance, {
  foreignKey: "userId",
  as: "WhatsappInstances",
});
WhatsappInstance.belongsTo(User, { foreignKey: "userId", as: "Owner" });

User.hasMany(Document, { foreignKey: "uploadedBy" });
Document.belongsTo(User, { foreignKey: "uploadedBy" });

User.hasMany(KnowledgeBase, { foreignKey: "uploadedBy" });
KnowledgeBase.belongsTo(User, { foreignKey: "uploadedBy" });

User.hasMany(Feedback, { foreignKey: "userId", as: "feedbacks" });
Feedback.belongsTo(User, { foreignKey: "userId", as: "user" });

export {
  User,
  Conversation,
  Cache,
  Document,
  Setting,
  KnowledgeBase,
  Coupon,
  UserUsage,
  WhatsappInstance,
  Client,
  Process,
  Event,
  Fee,
  Organization,
  Feedback,
  Announcement,
};
