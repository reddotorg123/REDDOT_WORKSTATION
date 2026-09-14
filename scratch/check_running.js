const { execSync } = require('child_process');
try {
  const out = execSync('powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -match \'reddot|electron\' } | Select-Object ProcessId, Name, Path, CommandLine | Format-List"').toString();
  console.log(out);
} catch (e) {
  console.log('Error:', e.message);
}
