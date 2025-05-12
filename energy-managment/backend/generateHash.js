const bcrypt = require('bcryptjs');
const password = 'minha123'; // Substitua pela senha desejada
bcrypt.hash(password, 10).then(hash => {
  console.log('Insira no MongoDB:');
  console.log(`{ username: "teste", password: "${hash}" }`);
});
