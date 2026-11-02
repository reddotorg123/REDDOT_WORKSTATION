/**
 * REDDOT WS - Enterprise Over-The-Air (OTA) Cloud Publisher
 * Packages the active UI bundle and uploads the version manifest and tar.gz package
 * directly to the Supabase CDN release bucket (and mirrors to Firestore if needed).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFile } = require('child_process');

const SUPABASE_PROJECT = process.env.SUPABASE_PROJECT_ID || 'eliyyiythrbcmwdrcvzk';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || Buffer.from('c2Jfc2VjcmV0X1VxQzloalo0dHZoZG5KZ3dhbFZheEFfemxYM0NsRUE=', 'base64').toString('utf8');
const BUCKET_NAME = 'reddot-releases';

function uploadToSupabase(fileName, fileBuffer, contentType) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${SUPABASE_PROJECT}.supabase.co`,
      port: 443,
      path: `/storage/v1/object/${BUCKET_NAME}/${fileName}`,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length,
        'x-upsert': 'true'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (_) {
            resolve(body);
          }
        } else {
          reject(new Error(`Supabase Storage returned HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(fileBuffer);
    req.end();
  });
}

function buildTarArchive(sourceDir, outputFile) {
  return new Promise((resolve, reject) => {
    // Exclude heavy video files (*.mp4) from the OTA patch because they rarely change
    // and are already installed on user workstations, keeping the bundle fast and compact (~1.7MB).
    const args = [
      '-czf',
      outputFile,
      '--exclude=*.mp4',
      '--exclude=*.png',
      '--exclude=*.jpg',
      '--exclude=*.jpeg',
      '--exclude=*.ico',
      '-C',
      sourceDir,
      '.'
    ];

    execFile('tar.exe', args, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`tar.exe packaging failed: ${stderr || err.message}`));
      }
      resolve();
    });
  });
}

async function main() {
  console.log('🚀 Starting REDDOT WS Next-Gen OTA Release Pipeline...');

  const rootDir = path.resolve(__dirname, '..');
  const versionPath = path.join(rootDir, 'version.json');
  const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

  const uiDir = path.join(rootDir, 'wallpaper-ui');
  if (!fs.existsSync(uiDir)) {
    throw new Error(`Directory ${uiDir} does not exist. Run 'npm run build:ui' first.`);
  }

  const tempTarPath = path.join(rootDir, 'ota-bundle.tar.gz');
  if (fs.existsSync(tempTarPath)) {
    fs.unlinkSync(tempTarPath);
  }

  console.log(`📦 Packaging optimized UI archive into ${path.basename(tempTarPath)}...`);
  await buildTarArchive(uiDir, tempTarPath);

  const tarStat = fs.statSync(tempTarPath);
  const tarSizeMB = (tarStat.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ UI Package created: ${tarStat.size.toLocaleString()} bytes (${tarSizeMB} MB)`);

  const tarBuffer = fs.readFileSync(tempTarPath);

  // 1. Upload tar.gz bundle to Supabase Storage
  console.log(`📡 1/2 Uploading ota-bundle.tar.gz to Supabase CDN bucket [${BUCKET_NAME}]...`);
  await uploadToSupabase('ota-bundle.tar.gz', tarBuffer, 'application/gzip');
  console.log('✅ Bundle uploaded successfully!');

  // Prepare public CDN URLs
  const bundlePublicUrl = `https://${SUPABASE_PROJECT}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/ota-bundle.tar.gz`;

  // 2. Prepare manifest
  const manifestData = {
    version: versionData.version,
    releaseDate: versionData.releaseDate || new Date().toISOString().slice(0, 10),
    minRequiredVersion: versionData.minRequiredVersion || '2.0.0',
    mandatory: !!versionData.mandatory,
    downloadUrl: versionData.downloadUrl || '',
    otaBundleUrl: bundlePublicUrl,
    bundleSize: tarStat.size,
    changelog: versionData.changelog || [
      'Next-Gen Over-The-Air (OTA) hotpatching engine deployed.',
      'Instant zero-downtime in-app updates with automated rollback.',
      'Optimized performance and theme-adaptive experience.'
    ],
    updatedAt: new Date().toISOString()
  };

  const manifestBuffer = Buffer.from(JSON.stringify(manifestData, null, 2), 'utf8');

  // 3. Upload version.json manifest to Supabase Storage
  console.log(`📡 2/2 Uploading version.json manifest to Supabase CDN bucket [${BUCKET_NAME}]...`);
  await uploadToSupabase('version.json', manifestBuffer, 'application/json');
  console.log('✅ Manifest uploaded successfully!');

  // Clean up temporary local archive
  if (fs.existsSync(tempTarPath)) {
    fs.unlinkSync(tempTarPath);
  }

  console.log(`\n🎉 REDDOT WS OTA Release v${versionData.version} is now LIVE on Cloud CDN!`);
  console.log(`   Manifest URL: https://${SUPABASE_PROJECT}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/version.json`);
  console.log(`   Bundle URL:   ${bundlePublicUrl}`);
}

main().catch(err => {
  console.error('❌ OTA Publication failed:', err);
  process.exit(1);
});
