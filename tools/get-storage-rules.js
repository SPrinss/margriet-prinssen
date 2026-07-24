const { GoogleAuth } = require('google-auth-library');
async function main() {
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/firebase'] });
  const client = await auth.getClient();
  const { data } = await client.request({ url: 'https://firebaserules.googleapis.com/v1/projects/margriet-prinssen/rulesets/6edc4bc5-150c-42b0-a1d6-bbb505d441c8' });
  console.log(data.source.files.map(f => f.content).join('\n'));
}
main().catch(e => { console.error(e.message); process.exit(1); });
