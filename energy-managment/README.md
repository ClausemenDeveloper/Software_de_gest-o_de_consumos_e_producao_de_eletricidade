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