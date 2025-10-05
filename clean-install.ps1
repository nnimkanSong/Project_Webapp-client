cd D:\Github\Project_Webapp-client

Write-Host "Cleaning node_modules and package-lock.json ..."

if (Test-Path package-lock.json) {
    Copy-Item package-lock.json package-lock.backup.json
    Write-Host "Backup package-lock.json -> package-lock.backup.json"
}

if (Test-Path node_modules) {
    Remove-Item -Recurse -Force node_modules
    Write-Host "node_modules deleted"
}

if (Test-Path package-lock.json) {
    Remove-Item -Force package-lock.json
    Write-Host "package-lock.json deleted"
}

npm cache clean --force

Write-Host "Installing dependencies..."
npm install

Write-Host "Reinstalling esbuild..."
npm install esbuild@latest --save-dev
npm rebuild esbuild

Write-Host "Done! Try running: npm run dev"

