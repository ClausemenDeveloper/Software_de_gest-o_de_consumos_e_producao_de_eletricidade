console.log('Script app.js carregado');

async function loginUser(event) {
  event.preventDefault();
  console.log('Evento de login disparado');

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
      showInstallationFormIfClient();
      fetchLocalEnergyData();
      fetchCertificates(); // Carregar certificados após login
    } else {
      document.getElementById('error-message').textContent = data.error || 'Erro ao fazer login';
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    document.getElementById('error-message').textContent = 'Erro ao conectar ao servidor';
  }
}

document.getElementById('loginForm').addEventListener('submit', loginUser);

function displayEnergyData(data) {
  console.log('Exibindo dados de energia:', data);
  const tableBody = document.getElementById('energy-table-body');
  if (tableBody) tableBody.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${item.type}</td><td>${new Date(item.date).toLocaleDateString()}</td><td>${item.kwh} kWh</td>`;
    tableBody?.appendChild(row);
  });

  const productionData = data.filter(item => item.type === 'production');
  const consumptionData = data.filter(item => item.type === 'consumption');
  const allDates = [...new Set([...productionData.map(item => new Date(item.date).toLocaleDateString()), ...consumptionData.map(item => new Date(item.date).toLocaleDateString())])].sort();
  const productionValues = allDates.map(date => productionData.find(item => new Date(item.date).toLocaleDateString() === date)?.kwh || 0);
  const consumptionValues = allDates.map(date => consumptionData.find(item => new Date(item.date).toLocaleDateString() === date)?.kwh || 0);

  const ctx = document.getElementById('energyChart')?.getContext('2d');
  if (ctx) {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: allDates,
        datasets: [
          {
            label: 'Produção de Energia (kWh)',
            data: productionValues,
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false
          },
          {
            label: 'Consumo de Energia (kWh)',
            data: consumptionValues,
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
  } else {
    console.error('Contexto do canvas não encontrado');
  }
}

function logout() {
  console.log('Logout disparado');
  localStorage.removeItem('token');
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('error-message').textContent = '';
}

function showInstallationFormIfClient() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Nenhum token encontrado');
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Payload do token decodificado:', payload);
    const role = payload.role;

    if (role === 'cliente') {
      document.getElementById('installation-form').style.display = 'block';
      document.getElementById('certificates').style.display = 'block';
    } else {
      document.getElementById('installation-form').style.display = 'none';
      document.getElementById('certificates').style.display = 'none';
    }
  } catch (e) {
    console.error('Erro ao decodificar token:', e);
  }
}

async function submitInstallation(event) {
  event.preventDefault();
  const date = document.getElementById('installation-date').value;
  const power = document.getElementById('power').value;
  const panels = document.getElementById('panels').value;
  const type = document.getElementById('panel-type').value;
  const address = document.getElementById('location').value;
  const latitude = document.getElementById('latitude').value;
  const longitude = document.getElementById('longitude').value;
  const docs = document.getElementById('documents').files;

  const formData = new FormData();
  formData.append('date', date);
  formData.append('power', parseFloat(power));
  formData.append('panels', parseInt(panels));
  formData.append('type', type);
  formData.append('address', address);
  formData.append('coordinates', JSON.stringify({ lat: parseFloat(latitude), lng: parseFloat(longitude) }));
  for (let doc of docs) {
    formData.append('documents', doc);
  }

  const token = localStorage.getItem('token');
  await fetch('http://localhost:3000/api/instalacoes', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
}

document.getElementById('installation-form').addEventListener('submit', submitInstallation);

async function fetchCertificates() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Nenhum token encontrado');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/meus-certificados', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const certificates = await response.json();
    console.log('Certificados recebidos:', certificates);

    const tableBody = document.getElementById('certificates-table-body');
    tableBody.innerHTML = '';

    certificates.forEach(cert => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${cert.instalacaoId}</td>
        <td>${new Date(cert.dataEmissao).toLocaleDateString()}</td>
        <td><a href="${cert.caminhoArquivo}" target="_blank">Baixar</a></td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Erro ao carregar certificados:', error);
    alert('Erro ao carregar certificados');
  }
}

async function addProduction() {
  console.log('Botão Adicionar Produção clicado');
  const date = document.getElementById('production-date').value;
  const kwh = parseFloat(document.getElementById('production-kwh').value);
  const token = localStorage.getItem('token');

  if (!token) {
    console.error('Nenhum token encontrado. Usuário não logado.');
    alert('Você precisa estar logado para registrar produção.');
    return;
  }

  if (!date || isNaN(kwh)) {
    console.error('Campos de produção inválidos:', { date, kwh });
    alert('Preencha todos os campos de produção corretamente.');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/production', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ date, kwh })
    });

    if (response.ok) {
      alert('Produção registrada com sucesso!');
      document.getElementById('production-date').value = '';
      document.getElementById('production-kwh').value = '';
      fetchLocalEnergyData();
    } else {
      const data = await response.json();
      alert('Erro ao registrar produção: ' + data.error);
    }
  } catch (error) {
    console.error('Erro ao registrar produção:', error);
    alert('Erro ao conectar ao servidor');
  }
}

async function addConsumption() {
  console.log('Botão Adicionar Consumo clicado');
  const date = document.getElementById('consumption-date').value;
  const kwh = parseFloat(document.getElementById('consumption-kwh').value);
  const token = localStorage.getItem('token');

  if (!token) {
    console.error('Nenhum token encontrado. Usuário não logado.');
    alert('Você precisa estar logado para registrar consumo.');
    return;
  }

  if (!date || isNaN(kwh)) {
    console.error('Campos de consumo inválidos:', { date, kwh });
    alert('Preencha todos os campos de consumo corretamente.');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/consumption', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ date, kwh })
    });

    if (response.ok) {
      alert('Consumo registrado com sucesso!');
      document.getElementById('consumption-date').value = '';
      document.getElementById('consumption-kwh').value = '';
      fetchLocalEnergyData();
    } else {
      const data = await response.json();
      alert('Erro ao registrar consumo: ' + data.error);
    }
  } catch (error) {
    console.error('Erro ao registrar consumo:', error);
    alert('Erro ao conectar ao servidor');
  }
}

async function fetchLocalEnergyData() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Nenhum token encontrado para carregar dados de energia');
    return;
  }

  try {
    const productionResponse = await fetch('http://localhost:3000/api/production', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const consumptionResponse = await fetch('http://localhost:3000/api/consumption', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const productions = await productionResponse.json();
    const consumptions = await consumptionResponse.json();

    const userData = [
      ...productions.map(item => ({ type: 'production', date: item.date, kwh: item.kwh })),
      ...consumptions.map(item => ({ type: 'consumption', date: item.date, kwh: item.kwh }))
    ];

    console.log('Dados de energia do usuário:', userData);
    displayEnergyData(userData);
  } catch (error) {
    console.error('Erro ao carregar dados de energia:', error);
    document.getElementById('error-message').textContent = 'Erro ao carregar os dados de energia';
  }
}

function mostrarFormularioInstalacaoSeCliente() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Nenhum token encontrado');
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Payload do token decodificado:', payload);
    const role = payload.role;

    if (role === 'cliente') {
      document.getElementById('formulario-instalacao').style.display = 'block';
      document.getElementById('certificados').style.display = 'block';
      document.getElementById('certificado-upload').style.display = 'none';
    } else if (role === 'tecnico') {
      document.getElementById('formulario-instalacao').style.display = 'none';
      document.getElementById('certificados').style.display = 'none';
      document.getElementById('certificado-upload').style.display = 'block';
      document.getElementById('tecnico-id').value = payload.userId; // Preenche automaticamente o ID do técnico
    }
  } catch (e) {
    console.error('Erro ao decodificar token:', e);
  }
}

async function uploadCertificado() {
  console.log('Botão Enviar Certificado clicado');
  const idCliente = document.getElementById('cliente-id').value;
  const idInstalacao = document.getElementById('instalacao-id').value;
  const idTecnico = document.getElementById('tecnico-id').value;
  const certificadoFile = document.getElementById('certificado-file').files[0];

  if (!idCliente || !idInstalacao || !idTecnico || !certificadoFile) {
    console.error('Campos de certificado inválidos:', { idCliente, idInstalacao, idTecnico, certificadoFile });
    alert('Preencha todos os campos corretamente.');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Utilizador não autenticado');
    alert('Você precisa estar logado para enviar um certificado.');
    return;
  }

  const formData = new FormData();
  formData.append('idCliente', idCliente);
  formData.append('idInstalacao', idInstalacao);
  formData.append('idTecnico', idTecnico);
  formData.append('certificado', certificadoFile);

  try {
    const response = await fetch('http://localhost:3000/api/certificados/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await response.json();
    if (response.ok) {
      alert('Certificado enviado com sucesso!');
      document.getElementById('certificado-upload').reset();
      document.getElementById('upload-message').textContent = 'Certificado enviado com sucesso!';
    } else {
      console.error('Erro ao enviar certificado:', data.error);
      alert('Erro ao enviar certificado: ' + data.error);
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    alert('Erro ao conectar ao servidor');
  }
}