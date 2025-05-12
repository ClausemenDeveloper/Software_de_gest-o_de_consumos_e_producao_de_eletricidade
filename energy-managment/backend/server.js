const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const moment = require('moment');
const User = require('./models/User');
const Production = require('./models/Production');
const Consumption = require('./models/Consumption');

const app = express();
app.use(express.json());
app.use(cors());

// Conexão com MongoDB
mongoose.set('strictQuery', true);
mongoose.connect('mongodb://192.168.176.1:27017/energy_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, 'secret_key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Rota de login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ userId: user._id }, 'minha2025', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Rotas de produção
app.post('/api/production', authMiddleware, async (req, res) => {
  const { date, kwh } = req.body;
  try {
    const production = new Production({
      userId: req.userId,
      date: new Date(date),
      kwh
    });
    await production.save();
    res.status(201).json(production);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar produção' });
  }
});

app.get('/api/production', authMiddleware, async (req, res) => {
  try {
    const productions = await Production.find({ userId: req.userId }).sort({ date: -1 });
    res.json(productions);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produção' });
  }
});

// Rotas de consumo
app.post('/api/consumption', authMiddleware, async (req, res) => {
  const { date, kwh } = req.body;
  try {
    const consumption = new Consumption({
      userId: req.userId,
      date: new Date(date),
      kwh
    });
    await consumption.save();
    res.status(201).json(consumption);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar consumo' });
  }
});

app.get('/api/consumption', authMiddleware, async (req, res) => {
  try {
    const consumptions = await Consumption.find({ userId: req.userId }).sort({ date: -1 });
    res.json(consumptions);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar consumo' });
  }
});

// Rota para métricas
app.get('/api/metrics', authMiddleware, async (req, res) => {
  try {
    const productions = await Production.find({ userId: req.userId });
    const consumptions = await Consumption.find({ userId: req.userId });

    const totalProduction = productions.reduce((sum, p) => sum + p.kwh, 0);
    const totalConsumption = consumptions.reduce((sum, c) => sum + c.kwh, 0);
    const balance = totalProduction - totalConsumption;
    const efficiency = totalConsumption > 0 ? (totalProduction / totalConsumption) * 100 : 0;

    res.json({
      totalProduction,
      totalConsumption,
      balance,
      efficiency: efficiency.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao calcular métricas' });
  }
});

app.get('/api/energy-data', authenticateToken, (req, res) => {
  const data = [
    { date: moment().subtract(6, 'days').format('YYYY-MM-DD'), energy: 10 },
    { date: moment().subtract(5, 'days').format('YYYY-MM-DD'), energy: 12 },
    { date: moment().subtract(4, 'days').format('YYYY-MM-DD'), energy: 15 },
    { date: moment().subtract(3, 'days').format('YYYY-MM-DD'), energy: 14 },
    { date: moment().subtract(2, 'days').format('YYYY-MM-DD'), energy: 18 },
    { date: moment().subtract(1, 'days').format('YYYY-MM-DD'), energy: 20 },
    { date: moment().format('YYYY-MM-DD'), energy: 22 }
  ];
  res.json(data);
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('Cabeçalho Authorization:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.log('Token não encontrado');
    return res.sendStatus(401);
  }

  jwt.verify(token, 'minha2025', (err, user) => {
    if (err) {
      console.log('Erro ao verificar token:', err.message);
      return res.sendStatus(403);
    }
    console.log('Token válido, usuário:', user);
    req.user = user;
    next();
  });
}

const EnergyData = require('./models/EnergyData'); // Crie o modelo
app.get('/api/energy-data', authenticateToken, async (req, res) => {
  const data = await EnergyData.find().sort({ date: 1 });
  res.json(data);
});

app.post('/api/energy-data', authenticateToken, async (req, res) => {
  const { date, energy, type } = req.body;
  if (!date || !energy || !type) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  try {
    const newData = new EnergyData({ date, energy, type });
    await newData.save();
    res.status(201).json({ message: 'Dados registrados com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar dados' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));