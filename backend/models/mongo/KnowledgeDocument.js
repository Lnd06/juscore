import mongoose from "mongoose";

const KnowledgeDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["book", "article", "document"],
      default: "book",
    },
    categoria: {
      type: String,
      enum: ["GERAL", "OAB", "TCC", "DOCUMENTOS"],
      default: "GERAL",
    },
    uploadedBy: {
      type: Number, // MySQL user id
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt automáticos
    collection: "livros", // usa a coleção já criada no Atlas
  },
);

// Texto index para buscas RAG futuras
KnowledgeDocumentSchema.index({ content: "text", title: "text" });

const KnowledgeDocument =
  mongoose.models.KnowledgeDocument ||
  mongoose.model("KnowledgeDocument", KnowledgeDocumentSchema);

export default KnowledgeDocument;
