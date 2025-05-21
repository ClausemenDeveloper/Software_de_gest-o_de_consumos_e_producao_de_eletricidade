const bcrypt = require('bcryptjs');
const hashFromDb = '$2a$10$SWmdNmHau7uYjESY1o5Lne8z10JuCLasjjvX0A2iUAmiqlQc8yJP.'; // Substitua pelo hash do MongoDB
const password = 'password123'; // Substitua pela senha que você deseja verificar

bcrypt.compare(password, hashFromDb).then(match => {
  console.log('Senha correta?', match);
});
