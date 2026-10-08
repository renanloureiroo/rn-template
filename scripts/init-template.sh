#!/usr/bin/env bash
# Transforma o template em um projeto novo: renomeia o app e escolhe a variante de navegação.
# Executado pelo workflow "Template init" (Actions → Run workflow) ou manualmente depois de clonar:
#
#   scripts/init-template.sh <nome-do-projeto> [--navigation=expo-router|react-navigation]
#   scripts/init-template.sh orders-app
#   scripts/init-template.sh orders-app --navigation=react-navigation
set -euo pipefail

usage() {
  echo "uso: scripts/init-template.sh <nome-do-projeto> [--navigation=expo-router|react-navigation]" >&2
  exit 1
}

name=""
navigation="expo-router"
for arg in "$@"; do
  case "$arg" in
    --navigation=*) navigation="${arg#--navigation=}" ;;
    -*) usage ;;
    *) name="$arg" ;;
  esac
done

[[ -n "$name" ]] || usage
[[ "$navigation" == "expo-router" || "$navigation" == "react-navigation" ]] || usage
cd "$(dirname "$0")/.."

[[ -f .template-init ]] || {
  echo "Este projeto já foi inicializado (.template-init ausente)." >&2
  exit 1
}

# orders-app → orders-app, OrdersApp, ordersapp, Orders App
kebab=$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')
[[ -n "$kebab" ]] || usage
pascal=$(printf '%s' "$kebab" | awk -F- '{ for (i = 1; i <= NF; i++) printf "%s%s", toupper(substr($i, 1, 1)), substr($i, 2) }')
compact=${kebab//-/}
title=$(printf '%s' "$kebab" | awk -F- '{ for (i = 1; i <= NF; i++) printf "%s%s%s", (i > 1 ? " " : ""), toupper(substr($i, 1, 1)), substr($i, 2) }')

echo "Projeto:      $kebab"
echo "Nome do app:  $pascal"
echo "Bundle id:    com.$compact"
echo "Navegação:    $navigation"

# Arquivos versionados, exceto workflows e o próprio mecanismo de inicialização.
files=()
while IFS= read -r file; do
  files+=("$file")
done < <(git ls-files | grep -vE '^(\.github/workflows/|scripts/init-template\.sh$|\.template-init$)')

for file in "${files[@]}"; do
  [[ -f "$file" ]] || continue
  perl -pi -e "
    s/^# RN Template\$/# $title/;
    s/rn-template/$kebab/g;
    s/RnTemplate/$pascal/g;
    s/rntemplate/$compact/g;
  " "$file"
done

# Variantes de navegação são excludentes. A dependência descartada sai do package.json e do
# lock sem reinstalar node_modules; o próximo `npm ci` já reflete a escolha.
if [[ "$navigation" == "expo-router" ]]; then
  discarded="react-navigation"
  git rm -rq src/navigation
  npm uninstall --package-lock-only --no-audit --no-fund \
    @react-navigation/native @react-navigation/native-stack \
    @rozenite/react-navigation-plugin >/dev/null
else
  discarded="expo-router"
  git rm -rq src/app
  npm uninstall --package-lock-only --no-audit --no-fund expo-router >/dev/null
  node -e '
    const fs = require("fs")
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
    pkg.main = "src/navigation/index.tsx"
    fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n")
    const app = JSON.parse(fs.readFileSync("app.json", "utf8"))
    app.plugins = app.plugins.filter((plugin) => plugin !== "expo-router")
    fs.writeFileSync("app.json", JSON.stringify(app, null, 2) + "\n")
  '
  # Desde o SDK 56 o Metro recusa @react-navigation/* quando o expo-router é resolvível, e no
  # SDK 57 ele sempre é: chega como dependência do @expo/cli. Sem o router em uso, a checagem
  # (que protege apps que misturam os dois) pode ser desligada, como a própria mensagem sugere.
  perl -0pi -e 's|(const \{ getDefaultConfig \} = require\("expo/metro-config"\)\n)|$1\n// Variante React Navigation: o expo-router chega como dependência transitiva do \@expo/cli e não\n// é usado. Ver docs/ARCHITECTURE.md, seção 11.\nprocess.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = "1"\n|' metro.config.js
fi

# Trechos de documentação que só valem para o template ou para a variante descartada.
for doc in README.md AGENTS.md docs/*.md; do
  [[ -f "$doc" ]] || continue
  perl -0pi -e "
    s/<!-- template:start -->.*?<!-- template:end -->//gs;
    s/<!-- navigation:$discarded:start -->.*?<!-- navigation:$discarded:end -->//gs;
    s/<!-- navigation:$navigation:(start|end) -->//g;
    s/\n{3,}/\n\n/g;
    s/([^\n])\n(#+ )/\1\n\n\2/g;
  " "$doc"
done

git rm -q .template-init scripts/init-template.sh
git add -A
echo "Pronto. Revise com 'git status' e rode npm ci && npm run verify."
