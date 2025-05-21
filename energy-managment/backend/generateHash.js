const bcrypt = require('bcryptjs');

async function generateHashes() {
  const users = {
    cliente1: 'senha123',
    tecnico1: 'tecnico123'
  };

  const hashes = {};
  for (const [username, password] of Object.entries(users)) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    hashes[username] = hash;
    console.log(`${username}: ${hash}`);
  }

  return hashes;
}

generateHashes()
  .then(hashes => {
    console.log('Hashes gerados:', hashes);
  })
  .catch(err => console.error('Erro ao gerar hashes:', err));