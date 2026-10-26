#!/usr/bin/env sh
# Atualiza o backend na VM sem tirar a API do ar: recria uma cópia por vez e só passa
# para a próxima quando a nova responde no /health. Uso: ./deploy.sh
set -eu
cd "$(dirname "$0")"

git pull --ff-only
docker compose build backend-1
docker compose up -d --no-deps lb

for svc in backend-1 backend-2; do
  docker compose up -d --no-deps --no-build "$svc"
  echo "Esperando $svc responder..."
  tries=0
  until docker compose exec -T lb wget -q -O /dev/null "http://$svc:8080/health"; do
    tries=$((tries + 1))
    if [ "$tries" -ge 60 ]; then
      # A outra cópia continua no ar; não segue para ela com uma versão quebrada.
      echo "$svc não subiu em 3 minutos. Últimas linhas do log:"
      docker compose logs --tail 50 "$svc"
      exit 1
    fi
    sleep 3
  done
  echo "$svc no ar."
done

docker image prune -f
