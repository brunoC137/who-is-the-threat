/**
 * TEMPORARY dev launcher — delete after use. Not referenced by package.json.
 *
 * Node's DNS SRV lookup is refused in this sandbox, so `mongodb+srv://` can
 * never resolve, even though raw TCP to the Atlas shards succeeds. This
 * rewrites the URI into the equivalent non-SRV seedlist form in memory and
 * then boots the real server unchanged.
 *
 * .env is left untouched and the credential is never logged.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const REPLICA_SET = 'atlas-m65y9x-shard-0';
const HOSTS = [
  'ac-bjnunke-shard-00-00.nv403h3.mongodb.net:27017',
  'ac-bjnunke-shard-00-01.nv403h3.mongodb.net:27017',
  'ac-bjnunke-shard-00-02.nv403h3.mongodb.net:27017',
];

const srv = process.env.MONGODB_URI || '';

if (srv.startsWith('mongodb+srv://')) {
  const parsed = new URL(srv);
  const credentials = parsed.username
    ? `${parsed.username}:${parsed.password}@`
    : '';

  // Carry over whatever options the original URI set, then add the ones the
  // SRV form would otherwise have supplied via its TXT record.
  const params = new URLSearchParams(parsed.search);
  params.set('ssl', 'true');
  params.set('replicaSet', REPLICA_SET);
  params.set('authSource', 'admin');
  if (!params.has('retryWrites')) params.set('retryWrites', 'true');
  if (!params.has('w')) params.set('w', 'majority');

  process.env.MONGODB_URI =
    `mongodb://${credentials}${HOSTS.join(',')}${parsed.pathname}?${params.toString()}`;

  console.log(`🔧 dev-direct: using non-SRV seedlist (${HOSTS.length} hosts, rs=${REPLICA_SET})`);
}

require('./server.js');
