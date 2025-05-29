const username = document.getElementById('username');
const erro = document.getElementById('p-error');
const styleError = "display: inline-block; color: red; text-align: center;";
const userConsumptionNow = document.getElementById('user-consumption-now');
const userConsumptionMonth = document.getElementById('user-consumption-month');
const userProductionNow = document.getElementById('user-production-now');
const userProductionMonth = document.getElementById('user-production-month');
const usernameCredits = document.getElementById('username-credits');
const container = document.getElementById('user');
const token = localStorage.getItem('token');

// Função para verificar o token e a role do utilizador
async function hasToken() {
    if (!token) {
        document.location.href = './index.html',true;
        return;
    }
  
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;
  
        if (!(role === 'gestor_operacoes')) {
            logout();
            return;
        }
    } catch (e) {
        logout();
        return;
    }
}

// Função que procura dos dados do utilizador dados no formulário de pesquisa
async function searchUser(e) {
    e.preventDefault();
    url = "http://localhost:3000/api/user/" + username.value;
    var response = await fetch('http://localhost:3000/api/user/' + username.value, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    var user = await response.json();
    if(!user.userId) {
        erro.innerHTML = "<b>Não foi possível encontrar esse utilizador.</b>";
        erro.style = styleError;
        return;
    }

    var userId = user.userId;
    var consumo = await fetch('http://localhost:3000/api/consumption/' + userId, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`  }
    });
    var consumoJson = await consumo.json();
    if(!consumoJson.kwhNow) {
        erro.innerHTML = "<b>" + consumoJson.error + "</b>";
        erro.style = styleError;
        return;
    }

    var producao = await fetch('http://localhost:3000/api/production/' + userId, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`  }
    });
    var producaoJson = await producao.json();
    if(!producaoJson.kwhNow) {
        erro.innerHTML = "<b>" + producaoJson.error + "</b>";
        erro.style = styleError;
        return;
    }

    var creditos = await fetch('http://localhost:3000/api/credits/' + userId, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`  }
    });
    var creditosJson = await creditos.json();
    if(!creditosJson.credits) {
        erro.innerHTML = "<b>" + creditosJson.error + "</b>";
        erro.style = styleError;
        return;
    }

    userConsumptionNow.innerHTML = consumoJson.kwhNow;
    userConsumptionMonth.innerHTML = consumoJson.kwhLastMonth;
    userProductionNow.innerHTML = producaoJson.kwhNow;
    userProductionMonth.innerHTML = producaoJson.kwhLastMonth;
    usernameCredits.innerHTML = "Nome de Utilizador: " + username.value + "<br/>Créditos: " + creditosJson.credits + "";
    container.style = "display: block;";
    return;
}

// Função de logout
function logout() {
    console.log('Logout disparado');
    localStorage.removeItem('token');
    document.location.href = './index.html',true;
}

hasToken();
document.getElementById('form-search').addEventListener('submit', searchUser);
document.getElementById('form-logout').addEventListener('submit', logout);