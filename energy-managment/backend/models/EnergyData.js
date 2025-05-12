const mongoose = require('mongoose');

const energyDataSchema = new mongoose.Schema({
  date: { type: String, required: true },
  energy: { type: Number, required: true },
  type: { type: String, required: true } // 'production' ou 'consumption'
});

module.exports = mongoose.model('EnergyData', energyDataSchema);