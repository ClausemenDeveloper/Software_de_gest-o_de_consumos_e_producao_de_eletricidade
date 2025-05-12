console.log('Script app.js carregado'); // Confirmar que o script está sendo executado

async function loginUser(event) {
  event.preventDefault();
  console.log('Evento de login disparado'); // Confirmar que o evento foi capturado
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  console.log('Dados de login:', { username, password });

  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    console.log('Resposta do servidor:', response.status, response.statusText);
    const data = await response.json();
    console.log('Dados recebidos:', data);
    if (data.token) {
      localStorage.setItem('token', data.token);
      console.log('Token armazenado:', localStorage.getItem('token'));
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      fetchEnergyData();
    } else {
      document.getElementById('error-message').textContent = data.error || 'Erro ao fazer login';
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    document.getElementById('error-message').textContent = 'Erro ao conectar ao servidor';
  }
}

document.getElementById('login-form').addEventListener('submit', loginUser);
async function fetchEnergyData() {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('http://localhost:3000/api/energy-data', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 403 || response.status === 401) {
      localStorage.removeItem('token');
      document.getElementById('dashboard').style.display = 'none';
      document.getElementById('login-form').style.display = 'block';
      document.getElementById('error-message').textContent = 'Sessão expirada. Faça login novamente.';
      return;
    }

    if (!response.ok) {
      throw new Error('Falha ao carregar os dados');
    }

    const data = await response.json();
    displayEnergyData(data);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    document.getElementById('error-message').textContent = 'Erro ao carregar os dados';
  }
}

function displayEnergyData(data) {
  const tableBody = document.getElementById('energy-table-body');
  tableBody.innerHTML = '';
  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${item.type}</td><td>${item.date}</td><td>${item.energy} kWh</td>`;
    tableBody.appendChild(row);
  });

  const productionData = data.filter(item => item.type === 'production');
  const consumptionData = data.filter(item => item.type === 'consumption');

  const ctx = document.getElementById('energyChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: productionData.map(item => item.date),
      datasets: [
        {
          label: 'Produção de Energia (kWh)',
          data: productionData.map(item => item.energy),
          borderColor: 'rgba(75, 192, 192, 1)',
          fill: false
        },
        {
          label: 'Consumo de Energia (kWh)',
          data: consumptionData.map(item => item.date).map(date => {
            const consumption = consumptionData.find(item => item.date === date);
            return consumption ? consumption.energy : 0;
          }),
          borderColor: 'rgba(255, 99, 132, 1)',
          fill: false
        }
      ]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Data' } },
        y: { title: { display: true, text: 'Energia (kWh)' } }
      }
    }
  });
}
function logout() {
  localStorage.removeItem('token');
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('error-message').textContent = '';
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'minha123', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

async function addConsumption() {
  const date = document.getElementById('consumption-date').value;
  const kwh = parseFloat(document.getElementById('consumption-kwh').value);
  const token = localStorage.getItem('token');

  if (!date || !kwh) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/energy-data', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date, energy: kwh, type: 'consumption' })
    });

    if (!response.ok) {
      throw new Error('Falha ao registrar consumo');
    }

    fetchEnergyData(); // Atualizar o dashboard
    document.getElementById('consumption-date').value = '';
    document.getElementById('consumption-kwh').value = '';
  } catch (error) {
    console.error('Erro ao adicionar consumo:', error);
    alert('Erro ao registrar consumo');
  }
}

async function addProduction() {
  const date = document.getElementById('production-date').value;
  const kwh = parseFloat(document.getElementById('production-kwh').value);
  const token = localStorage.getItem('token');

  if (!date || !kwh) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/energy-data', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date, energy: kwh, type: 'production' })
    });

    if (!response.ok) {
      throw new Error('Falha ao registrar produção');
    }

    fetchEnergyData(); // Atualizar o dashboard
    document.getElementById('production-date').value = '';
    document.getElementById('production-kwh').value = '';
  } catch (error) {
    console.error('Erro ao adicionar produção:', error);
    alert('Erro ao registrar produção');
  }
}