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




===============================================
##1. Install MongoDB Properly
##For Ubuntu/WSL (Linux)
##Run these commands to install MongoDB:

bash
    # 1. Import the MongoDB GPG key
    sudo apt-get install gnupg curl
    curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-archive-keyring.gpg

    # 2. Add the MongoDB repository
    echo "deb [signed-by=/usr/share/keyrings/mongodb-archive-keyring.gpg] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

    # 3. Update & Install MongoDB
    sudo apt-get update
    sudo apt-get install -y mongodb-org

    # 4. Start MongoDB
    sudo systemctl start mongod
    sudo systemctl enable mongod  # Auto-start on boot
    Verify Installation
    bash
    mongod --version
    ✅ Should now show MongoDB version (e.g., db version v6.0.x).

##For Windows (if not using WSL)
    Download MongoDB from:
    🔗 https://www.mongodb.com/try/download/community

Run the installer and check "Install MongoDB as a Service".

After installation, MongoDB should run automatically on 127.0.0.1:27017.

Verify on Windows
Open Command Prompt and run:

##cmd
    mongod --version
✅ Should display the installed version.

##2. If MongoDB Still Doesn’t Run
Check if MongoDB is Running
On Linux/WSL
bash
    sudo systemctl status mongod
      ##✅ Good: Active: active (running)

❌ If not running:

##bash
    sudo systemctl start mongod
On Windows
  Open Task Manager → Services → Check if MongoDB is running.

If not, run:

cmd
net start MongoDB
3. Manually Start MongoDB (Alternative)
If the service fails, run MongoDB manually (keep the terminal open):

##bash
  sudo mongod --dbpath /data/db

(If /data/db doesn’t exist, create it with sudo mkdir -p /data/db and set permissions with sudo chown -R $USER /data/db.)

##4. Try Connecting Again
Once MongoDB is running, your Node.js app should connect:

##javascript
      mongoose.connect('mongodb://127.0.0.1:27017/your-db-name')
     .then(() => console.log('✅ MongoDB Connected!'))
      .catch(err => console.error('❌ Connection failed:', err));
5. Still Issues? Use MongoDB Atlas (Cloud)
If local setup fails, use a free cloud database:

Sign up at MongoDB Atlas.

Create a free cluster.

Get the connection string and replace in your code:

##javascript
    mongoose.connect('mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/your-db');
Final Checks
✅ mongod --version → Should show MongoDB installed.

✅ sudo systemctl status mongod → Should be active (running).

✅ Try connecting via mongo shell:

##bash
    mongo --host 127.0.0.1 --port 27017
If you still get command not found, ensure MongoDB was installed correctly (check /usr/bin/mongod exists). Let me know if you need further help!


