# Aplica a configuracao global do Claude Code (passo 2 do SETUP-CLAUDE.md).
# Nao copia as skills: as instaladas costumam ser mais novas que as deste repositorio.
$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
$dst = Join-Path $env:USERPROFILE '.claude'
New-Item -ItemType Directory -Force $dst | Out-Null

foreach ($f in 'settings.json', 'CLAUDE.md') {
    if (Test-Path "$dst\$f") { Copy-Item "$dst\$f" "$dst\$f.bak" -Force }
}
Copy-Item "$src\CLAUDE.md", "$src\RTK.md", "$src\ponytail-statusline.ps1" $dst -Force

$json = (Get-Content "$src\settings.json" -Raw -Encoding UTF8).Replace('__CLAUDE_DIR__', $dst.Replace('\', '\\'))
[IO.File]::WriteAllText("$dst\settings.json", $json, (New-Object Text.UTF8Encoding $false))
$null = Get-Content "$dst\settings.json" -Raw | ConvertFrom-Json

Write-Host "Configuracao aplicada em $dst (backups em *.bak)." -ForegroundColor Green
