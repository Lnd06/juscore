import mongoose from 'mongoose';

const statsSchema = new mongoose.Schema({
  data: {
    type: Date,
    default: Date.now,
    unique: true
  },
  totalRequests: {
    type: Number,
    default: 0
  },
  usuariosAtivos: {
    type: Number,
    default: 0
  },
  novosUsuarios: {
    type: Number,
    default: 0
  },
  requestsPorHora: [{
    hora: Number,
    count: Number
  }]
});

export default mongoose.model('Stats', statsSchema);