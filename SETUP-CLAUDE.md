# Setup do Claude Code em um PC novo

Reproduz meu ambiente: ponytail, effortless, rtk, graphify, CLAUDE.md global e skills.
Os arquivos ficam em [`claude-setup/`](claude-setup/) (cópia de `~/.claude`, sem credenciais).

## 1. Pré-requisitos

```powershell
winget install OpenJS.NodeJS.LTS
winget install Python.Python.3.12
winget install Git.Git
npm install -g @anthropic-ai/claude-code
winget install rtk-ai.rtk
python -m pip install graphifyy
```

Abra um terminal novo e confira: `claude --version`, `rtk --version`, `graphify --help`.

## 2. Copiar a configuração global

Rode na raiz deste repositório (PowerShell):

```powershell
$dst = "$env:USERPROFILE\.claude"
New-Item -ItemType Directory -Force $dst | Out-Null
if (Test-Path "$dst\settings.json") { Copy-Item "$dst\settings.json" "$dst\settings.json.bak" -Force }
Copy-Item claude-setup\CLAUDE.md, claude-setup\RTK.md, claude-setup\ponytail-statusline.ps1 $dst -Force
Copy-Item claude-setup\skills $dst -Recurse -Force
$json = (Get-Content claude-setup\settings.json -Raw -Encoding UTF8).Replace('__CLAUDE_DIR__', $dst.Replace('\', '\\'))
[IO.File]::WriteAllText("$dst\settings.json", $json, (New-Object Text.UTF8Encoding $false))
```

O `settings.json` traz:
- hook `rtk hook claude` (comprime a saída dos comandos Bash);
- plugins `ponytail` e `effortless` com seus marketplaces (o Claude instala sozinho na primeira sessão);
- status line do ponytail, modelo, effort e tema.

## 3. Conferir

Abra `claude` dentro do projeto:
- a sessão deve começar com `PONYTAIL MODE ACTIVE`;
- `/plugin` deve listar `ponytail` e `effortless` ativos (se não, instale por ali);
- `/graphify` deve estar disponível;
- no terminal, a barra de status mostra `[PONYTAIL]` (no app desktop ela não aparece, mas o plugin funciona).

## Atualizar esta cópia

Depois de mudar algo em `~/.claude`, rode na raiz do repo:

```powershell
$c = "$env:USERPROFILE\.claude"
Copy-Item "$c\CLAUDE.md", "$c\RTK.md", "$c\ponytail-statusline.ps1" claude-setup -Force
Copy-Item "$c\skills" claude-setup -Recurse -Force
```

O `settings.json` precisa ser atualizado à mão: mantenha `__CLAUDE_DIR__` no caminho da status line.
Nunca copie `.credentials.json`.
