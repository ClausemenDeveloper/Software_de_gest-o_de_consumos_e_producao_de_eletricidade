const mongoose = require('mongoose');

const installationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Utilizador' },
  date: { type: Date, required: true },
  power: { type: Number, required: true },
  panels: { type: Number, required: true },
  type: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  documents: [{ type: String }],
  estado: { type: String, default: 'pendente', enum: ['pendente', 'aprovada', 'rejeitada'] },
  createdAt: { type: Date, default: Date.now },
  dataAprovacao: { type: Date }
});

module.exports = mongoose.model('Installation', installationSchema);