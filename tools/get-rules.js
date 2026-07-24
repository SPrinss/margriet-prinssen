const { GoogleAuth } = require('google-auth-library');
async function main() {
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/firebase'] });
  const client = await auth.getClient();
  const base = 'https://firebaserules.googleapis.com/v1/projects/margriet-prinssen';
  const { data: rel } = await client.request({ url: `${base}/releases` });
  for (const release of rel.releases || []) {
    console.log('RELEASE:', release.name, '->', release.rulesetName);
  }
  const fsRelease = (rel.releases || []).find(r => r.name.includes('cloud.firestore'));
  if (fsRelease) {
    const { data: ruleset } = await client.request({ url: `https://firebaserules.googleapis.com/v1/${fsRelease.rulesetName}` });
    console.log('\n--- deployed firestore rules ---\n' + ruleset.source.files.map(f => f.content).join('\n'));
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
