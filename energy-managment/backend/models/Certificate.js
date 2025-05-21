const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  clienteId: { type: mongoose.Schema.Types.ObjectId, required: true },
  instalacaoId: { type: mongoose.Schema.Types.ObjectId, required: true },
  emitidoPor: { type: String, required: true },
  dataEmissao: { type: Date, default: Date.now },
  hashDigital: { type: String, required: true },
  caminhoArquivo: { type: String, required: true },
  certificadoBase64: { type: String }
});

module.exports = mongoose.model('Certificate', certificateSchema);