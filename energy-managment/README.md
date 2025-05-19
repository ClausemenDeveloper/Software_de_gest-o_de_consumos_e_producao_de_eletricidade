# Energy Management App

Aplicação para gestão de produção e consumo de energia solar.

## Pré-requisitos
- Node.js
- MongoDB
- MongoDB Compass
- Postman

## Configuração

### Backend
1. Navegue até `backend/`
2. Execute `npm install`
3. Inicie o MongoDB
4. Crie um usuário de teste:
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('sua_senha', 10).then(hash => {
  // Inserir no MongoDB na coleção 'users':
  // { username: 'teste', password: hash }
});

#Instruções Adicionais
=====================================
para usar no Sistema de electricidade
npx http-server no frontend

============================
npm strat -> no backend


================================
POST: /api/login
{
	"username":"teste",
	"password":"minha123"
}

, e depois copiar o token dado

e passar no cabeçalho como
key: Authorizaion
value: Bearer <token>

com o endereço : api/energy-data
#Sprint 1

#ir ver o (ipconfig)
(ps: na parte de wsl ipv4), colocar no cmd

## No WSL, teste a conexão usando o IP do Windows:
## bash
# Teste a conexão com o MongoDB
mongosh 

##Novas Informaçoes
primeiro:
  verificar a BD com o comando mongosh no Wsl ou bash

segundo: 
  copiar para o postman as credenciais depois de ter 
  criado uma password nova e ter setado na base de dados
terceiro:
  No postman coloque por exemplo:
  {
  "username": "testuser",
  "password": "senha123"
  }

quarto:
  inicie o backend e faça o login com o utilizador

===========================================
##Sprint 2


