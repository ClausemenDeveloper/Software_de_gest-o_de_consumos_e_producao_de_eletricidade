const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const moment = require('moment');
const fs = require('fs'); // Adicionar esta linha

const Installation = require('./models/Installation');
const User = require('./models/User');
const Production = require('./models/Production');
const Consumption = require('./models/Consumption');
const EnergyData = require('./models/EnergyData');
const Certificate = require('./models/Certificate');
const Credit = require('./models/Credit');

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Configuração do Multer para upload de arquivos
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) { // Agora fs está definido
  fs.mkdirSync(uploadDir);
  console.log('Diretório uploads/ criado');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF, JPG ou PNG são permitidos!'));
    }
  }
});

// Configuração
const JWT_SECRET = 'minha123'; // Use variáveis de ambiente em produção

// Conexão com MongoDB
mongoose.set('strictQuery', true);
mongoose.connect('mongodb://localhost:27017/energy_management', {
}).then(() => {
  console.log('MongoDB conectado');
}).catch(err => {
  console.error('Erro na conexão com MongoDB:', err);
});

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    req.userRole = user.role;
    req.username = user.username;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para autorizar clientes
const authorizeClient = (req, res, next) => {
  if (req.userRole !== 'cliente') {
    return res.status(403).json({ error: 'Apenas clientes podem acessar esta rota.' });
  }
  next();
};

// Middleware para autorizar técnicos
const authorizeTechnician = (req, res, next) => {
  if (req.userRole !== 'tecnico') {
    return res.status(403).json({ error: 'Apenas técnicos podem acessar esta rota.' });
  }
  next();
};

// Middleware para autorizar gestores de operações
const authorizeOperationsManager = (req, res, next) => {
  if (req.userRole !== 'gestor_operacoes') {
    return res.status(403).json({ error: 'Apenas gestores de operações podem acessar esta rota.' });
  }
  next();
};

// Middleware para verificar a existência de dados de consumo nos últimos 6 meses
async function verifyConsumption(userId, res) {
  const response = await fetch('http://localhost:4000/consumption/month');
  const responseJson = await response.json();
  // Obter data inicial e final do mês em questão
  var date = new Date(), y = date.getFullYear(), m = date.getMonth();
  m = m - 1;
  if(m < 0) { y = y - 1; m += 12; }
  var firstDay = new Date(y, m, 1);
  var lastDay = new Date(y, m + 1, 0);
  // Ver se existe na base de dados, dados de consumo do mês passado
  var consumption = await Consumption.findOne({ userId: userId, date: { $gte: firstDay, $lt: lastDay }});
  if(!consumption) {
    // Criar data do mês em questão
    if(m !== 1) { d = 1 + Math.floor(Math.random() * 30); } else { d = 1 + Math.floor(Math.random() * 28); }
    var dataMes = new Date(y, m, d);
    // Criar documento para inserir na BD
    const consumptionMonth = new Consumption({
      userId: userId,
      kwh: responseJson.kwh,
      date: dataMes
    });
    consumptionLastMonth = responseJson.kwh;
    // Inserir documento criado
    try {
      consumptionMonth.save();
      console.log('Novo registo de consumos do utilizador ' + userId);
    } catch(error) {
      console.log('Erro ao salvar registo de consumos.\n' + error);
      return res.status(400).json( {error: "Erro ao salvar registo de consumos."});
    }
  } else {
    consumptionLastMonth = await consumption.kwh;
  }
  return await consumptionLastMonth;
};

// Middleware para verificar a existência de instalacoes e de dados de produção
async function verifyProduction(userId, res) {
  // Verificar se o utilizador tem instalações
  Installation.findOne({userId: userId})
  .then((result) => {
    if(!result) {
      return res.status(400).json({error: "Utilizador não tem instalações."});
    }
  });

  // Buscar dados de produção para um mês
  const response = await fetch('http://localhost:4000/production/month');
  const responseJson = await response.json();
  // Obter data inicial e final do mês em questão
  var date = new Date(), y = date.getFullYear(), m = date.getMonth();
  m = m - 1;
  if(m < 0) { y = y - 1; m += 12; }
  var firstDay = new Date(y, m, 1);
  var lastDay = new Date(y, m + 1, 0);

  // Ver se existe na base de dados, dados de produção do mês passado
  var production = await Production.findOne({ userId: userId, date: { $gte: firstDay, $lt: lastDay }});
  if(!production) {
    // Criar data do mês em questão
    if(m !== 1) { d = 1 + Math.floor(Math.random() * 30); } else { d = 1 + Math.floor(Math.random() * 28); }
    var dataMes = new Date(y, m, d);
    // Criar documento para inserir na BD
    const productionMonth = new Production({
      userId: userId,
      kwh: responseJson.kwh,
      date: dataMes
    });

    productionLastMonth = responseJson.kwh;
    // Inserir documento criado
    try {
      productionMonth.save();
      console.log('Novo registo de produção do utilizador ' + userId);
    } catch(error) {
      console.log('Erro ao salvar registo de produção.\n' + error);
      return res.status(400).json( {error: "Erro ao salvar registo de produção."});
    }
  } else {
    productionLastMonth = await production.kwh;
  }
  return await productionLastMonth;
};

// Rota de login
app.post('/api/login', async (req, res) => {
  console.log('Requisição recebida:', req.body);
  const { username, password } = req.body;

  if (!username || !password) {
    console.log('Campos ausentes:', { username, password });
    return res.status(400).json({ error: 'Campos username e password são obrigatórios' });
  }

  try {
    console.log('Buscando usuário:', username);
    const user = await User.findOne({ username });
    console.log('Usuário encontrado:', user);

    if (!user) {
      console.log('Usuário não encontrado');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Comparando senha com hash:', user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Senha corresponde:', isMatch);

    if (!isMatch) {
      console.log('Senha inválida');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, 'minha123', { expiresIn: '1h' });
    console.log('Token gerado:', token);
    res.json({ token });
  } catch (error) {
    console.error('Erro no servidor:', error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ROTAS DE PRODUÇÃO
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

// Endpoint para enviar dados de produção de energia de um utilizador dado no body
app.get('/api/production/:user', authMiddleware, authorizeOperationsManager, async (req, res) => {
  // Validação dos dados
  if(!req.params.user) {
    return res.status(400).json({error: "Utilizador não especifícado."});
  }
  // Verificar dados de produção do mês passado
  var user = req.params.user;
  var productionLastMonth = await verifyProduction(user, res);
  // Ir buscar dados de produção no momento
  var response = await fetch('http://localhost:4000/production/now');
  var json = await response.json();
  console.log("Dados Recebidos. " + json.kwh);

  // Criar JSON para enviar dados de produção no momento
  const production = {
    kwhLastMonth: productionLastMonth,
    kwhNow: json.kwh
  };
  // Enviar dados de produção
  try {
    return res.status(201).json(production);
  } catch(error) {
    return res.status(400).json({ error: 'Não foi possível enviar dados de produção.' });
  }
});

app.get('/api/production-all', authMiddleware, async (req, res) => {
  try {
    const productions = await Production.find({ userId: req.userId }).sort({ date: -1 });
    res.json(productions);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produção' });
  }
});

// ROTAS DE CONSUMO
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

// Endpoint para enviar dados de consumo de energia
app.get('/api/consumption/:user', authMiddleware, authorizeOperationsManager, async (req, res) => {
  // Validação dos dados
  if(!req.params.user) {
    return res.status(400).json({error: "Utilizador não especifícado."});
  }
  // Verificar dados de consumo do mês passado
  var user = req.params.user;
  var consumptionLastMonth = await verifyConsumption(user, res);
  // Ir buscar dados de consumo no momento
  var response = await fetch('http://localhost:4000/consumption/now');
  var json = await response.json();
  console.log("Dados Recebidos. " + json.kwh);

  // Criar JSON para enviar dados de consumo
  const consumptionNow = {
    kwhLastMonth: consumptionLastMonth,
    kwhNow: json.kwh,
  };

  // Enviar dados de consumo
  try {
    return res.status(201).json(consumptionNow);
  } catch(error) {
    return res.status(400).json({ error: 'Não foi possível enviar dados de consumo.' });
  }
});

app.get('/api/consumption-all', authMiddleware, async (req, res) => {
  try {
    const consumptions = await Consumption.find({ userId: req.userId }).sort({ date: -1 });
    res.json(consumptions);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar consumo' });
  }
});

// Endpoint para enviar os creditos de um utilizador
app.get('/api/credits/:user', authMiddleware, authorizeOperationsManager, async (req, res) => {
  // Validação dos dados
  if(!req.params.user) {
    return res.status(400).json({error: "Utilizador não especifícado."});
  }
  // Verificar dados de produção e consumo do mês passado
  var user = req.params.user;
  var productionLastMonth = await verifyProduction(user, res);
  var consumptionLastMonth = await verifyConsumption(user, res);
  // Definir os creditos
  if(productionLastMonth > consumptionLastMonth) {
    var credits = Math.floor(productionLastMonth - consumptionLastMonth);
  } else {
    var credits = 0;
  }
  // Buscar os creditos já existentes
  var oldCredits = await Credit.findOne({ userId: user });
  if(oldCredits) {
    date = new Date();
    if(!(oldCredits.timestamp.getMonth() === date.getMonth()))
      credits += await oldCredits.credits;
    else
      return res.status(200).json({ credits: credits });
  } else {
    creditsJson = new Credit({
      userId: user,
      credits: credits
    });
    try {
      creditsJson.save();
      return res.status(201).json({credits: credits});
    } catch(error) {
      return res.status(400).json({error: "Ocorreu um erro a salvar os créditos."});
    }
  }
  try {
    await oldCredits.updateOne({ credits: credits });
  } catch(error) {
    return res.status(400).json({error: "Ocorreu um erro a salvar os créditos."});
  }
  return res.status(201).json({ credits: credits });
});

app.get('/api/user/:username', authMiddleware, authorizeOperationsManager,  async (req, res) => {
  if(!req.params.username) {
    return res.status(400).json({error: "É necessário o username."});
  }
  var user = await User.findOne({ username: req.params.username });
  if(!user) {
    return res.status(400).json({error: "Não foi possível encontrar este utilizador."});
  }
  return res.status(200).json({ userId: user._id });
});

// MÉTRICAS
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

// DADOS DE ENERGIA
app.get('/api/energy-data', authMiddleware, async (req, res) => {
  try {
    const data = await EnergyData.find().sort({ date: 1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados de energia' });
  }
});

app.post('/api/energy-data', authMiddleware, async (req, res) => {
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

// ROTAS DE INSTALAÇÕES SOLARES
app.post('/api/instalacoes', authMiddleware, authorizeClient, upload.array('documents', 10), async (req, res) => {
  try {
    const { date, power, panels, type, address, coordinates } = req.body;
    const parsedCoordinates = JSON.parse(coordinates);

    // Validação de campos obrigatórios
    if (!date || !power || !panels || !type || !address || !parsedCoordinates.lat || !parsedCoordinates.lng) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    // Verificação de arquivos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Pelo menos um documento é obrigatório' });
    }

    const installation = new Installation({
      userId: req.userId,
      date,
      power: parseFloat(power),
      panels: parseInt(panels),
      type,
      address,
      coordinates: parsedCoordinates,
      documents: req.files.map(file => file.path),
      estado: 'pendente', // Ajuste para 'estado' se for o campo do modelo
      createdAt: new Date("2025-05-21T18:11:00Z") // Ajustado para 06:11 PM WEST
    });

    await installation.save();

    res.status(201).json({
      message: 'Instalação registrada com sucesso',
      installation: installation
    });
  } catch (error) {
    console.error('Erro ao registrar instalação:', error);
    if (error.message.includes('Apenas arquivos PDF, JPG ou PNG são permitidos!')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Ver todas as instalações do usuário autenticado
app.get('/api/instalacoes', authMiddleware, async (req, res) => {
  try {
    const installations = await Installation.find({ userId: req.userId }).sort({ date: -1 });
    res.json(installations);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar instalações' });
  }
});

// Listar Instalações Pendentes (Técnicos)
app.get('/api/instalacoes/pendentes', authMiddleware, authorizeTechnician, async (req, res) => {
  try {
    const installations = await Installation.find({ status: 'pendente' });
    res.json(installations);
  } catch (error) {
    console.error('Erro ao listar instalações:', error);
    res.status(500).json({ error: 'Erro ao listar instalações' });
  }
});

// Aprovar Instalação
app.patch('/api/instalacoes/:id/aprovar', authMiddleware, authorizeTechnician, async (req, res) => {
  try {
    const installation = await Installation.findById(req.params.id);
    if (!installation) {
      return res.status(404).json({ error: 'Instalação não encontrada' });
    }

    installation.status = 'aprovado';
    await installation.save();

    // Gerar certificado
    const certificate = new Certificate({
      clienteId: installation.userId,
      instalacaoId: installation._id,
      emitidoPor: req.username,
      dataEmissao: new Date(),
      hashDigital: require('crypto').createHash('sha256').update(JSON.stringify(installation)).digest('hex'),
      caminhoArquivo: `/uploads/certificado_${installation._id}.pdf` // Simulado
    });

    await certificate.save();
    res.json({ message: 'Instalação aprovada e certificado gerado', certificate });
  } catch (error) {
    console.error('Erro ao aprovar instalação:', error);
    res.status(500).json({ error: 'Erro ao aprovar instalação' });
  }
});

// Rejeitar Instalação
app.patch('/api/instalacoes/:id/rejeitar', authMiddleware, authorizeTechnician, async (req, res) => {
  const { motivo } = req.body;
  try {
    const installation = await Installation.findById(req.params.id);
    if (!installation) {
      return res.status(404).json({ error: 'Instalação não encontrada' });
    }

    installation.status = 'rejeitado';
    installation.motivoRejeicao = motivo;
    await installation.save();
    res.json({ message: 'Instalação rejeitada', installation });
  } catch (error) {
    console.error('Erro ao rejeitar instalação:', error);
    res.status(500).json({ error: 'Erro ao rejeitar instalação' });
  }
});

// Listar Certificados do Cliente
app.get('/api/meus-certificados', authMiddleware, authorizeClient, async (req, res) => {
  try {
    const certificates = await Certificate.find({ clienteId: req.userId });
    res.json(certificates);
  } catch (error) {
    console.error('Erro ao listar certificados:', error);
    res.status(500).json({ error: 'Erro ao listar certificados' });
  }
});

// NOVA ROTA: Upload de Certificados por Técnicos
app.post('/api/certificados/upload', authMiddleware, authorizeTechnician, upload.single('certificado'), async (req, res) => {
  try {
    const { idCliente, idInstalacao, idTecnico } = req.body;

    // Validar campos obrigatórios
    if (!idCliente || !idInstalacao || !idTecnico || !req.file) {
      return res.status(400).json({ error: 'Todos os campos (idCliente, idInstalacao, idTecnico e certificado) são obrigatórios.' });
    }

    // Buscar usuário correspondente por ID ou nome
    const user = await User.findOne({
      $or: [
        { _id: idCliente },
        { username: idCliente }
      ]
    });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Validar a instalação
    const installation = await Installation.findById(idInstalacao);
    if (!installation) {
      return res.status(404).json({ error: 'Instalação não encontrada.' });
    }
    if (installation.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'A instalação não pertence ao cliente informado.' });
    }

    // Salvar o arquivo no disco
    const filePath = `uploads/certificado_${idInstalacao}_${Date.now()}.pdf`;
    fs.writeFileSync(filePath, req.file.buffer);

    // Converter para Base64
    const certificadoBase64 = req.file.buffer.toString('base64');

    // Criar o certificado
    const certificado = new Certificate({
      clienteId: user._id,
      instalacaoId: idInstalacao,
      emitidoPor: req.username,
      dataEmissao: new Date(), // 21 de maio de 2025, 16:52 WEST
      hashDigital: crypto.createHash('sha256').update(certificadoBase64).digest('hex'),
      caminhoArquivo: `/${filePath}`,
      certificadoBase64
    });

    // Salvar o certificado
    await certificado.save();

    res.status(201).json({ message: 'Certificado enviado com sucesso', certificado });
  } catch (error) {
    console.error('Erro ao fazer upload do certificado:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do certificado' });
  }
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));