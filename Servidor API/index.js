const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Função que gera números aleatórios com início em start e fim em (start + interval - 1)
function randomValueBetween(start, interval) {
  number = start + Math.random() * interval;
  number = (Math.round(number * 100) / 100).toFixed(2);
  return number;
}

// Endpoint GET para envio de dados de consumo no momento
app.get('/consumption/now', async (req, res) => {
    var randomNumber = randomValueBetween(1.0, 1.0);
    var consumption = { kwh: randomNumber };
    try {
      res.status(201).json(consumption);
    } catch (error) {
      res.status(400).json({ error: 'Erro ao enviar dados de consumo.' });
    }
});

// Endpoint GET para envio de dados de consumo num mês
app.get('/consumption/month', async (req, res) => {
  var randomNumber = randomValueBetween(800.0, 200.0);
  var consumption = { kwh: randomNumber };
  try {
    res.status(201).json(consumption);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao enviar dados de consumo.' });
  }
});

// Endpoint GET para envio de dados de produção no momento
app.get('/production/now', async (req, res) => {
  var randomNumber = randomValueBetween(1.0, 1.0);
    var production = { kwh: randomNumber };
    try {
      res.status(201).json(production);
    } catch (error) {
      res.status(400).json({ error: 'Erro ao enviar dados de produção.' });
    }
});

// Endpoint GET para envio de dados de produção num mês
app.get('/production/month', async (req, res) => {
    var randomNumber = randomValueBetween(800.0, 200.0);
    var production = { kwh: randomNumber };
    try {
      res.status(201).json(production);
    } catch (error) {
      res.status(400).json({ error: 'Erro ao enviar dados de produção.' });
    }
});

app.listen(4000, () => console.log('Servidor rodando na porta 4000'));