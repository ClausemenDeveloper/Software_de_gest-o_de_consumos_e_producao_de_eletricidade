const bcrypt = require('bcryptjs');

bcrypt.hash('senha123', 10).then(hash => {
  console.log('Hash gerado:', hash);
});
