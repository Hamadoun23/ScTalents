#!/bin/bash
# Installation / mise à jour du site sur le serveur.
# Usage (depuis le poste) :
#   git archive --format=tar HEAD backend deploy | ssh dilitech-vps "cat > /tmp/sctalents.tar"
#   ssh dilitech-vps "bash -s" < deploy/deployer.sh
set -euo pipefail
R=/opt/sctalents
HOTE=sctalents.169-58-85-222.sslip.io

# 1) Première installation : utilisateur système, dossiers, ffmpeg, secrets
id sctalents >/dev/null 2>&1 || useradd --system --home "$R" --shell /usr/sbin/nologin sctalents
mkdir -p "$R/donnees/media"
command -v ffmpeg >/dev/null || (apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg python3-venv)
if [ ! -f "$R/.env" ]; then
  cat > "$R/.env" <<EOF
DEBUG=0
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
ALLOWED_HOSTS=$HOTE
CSRF_TRUSTED_ORIGINS=https://$HOTE
DATA_DIR=$R/donnees
EOF
  chmod 600 "$R/.env"
fi

# 2) Nouveau code (l'ancien est gardé en secours)
rm -rf "$R/neuf" && mkdir -p "$R/neuf"
tar -xf /tmp/sctalents.tar -C "$R/neuf"
[ -d "$R/app" ] && rm -rf "$R/precedent" && mv "$R/app" "$R/precedent"
mv "$R/neuf/backend" "$R/app"
cp "$R/neuf/deploy/sctalents.service" /etc/systemd/system/sctalents.service
[ -f /etc/nginx/sites-available/sctalents.conf ] || cp "$R/neuf/deploy/nginx-sctalents.conf" /etc/nginx/sites-available/sctalents.conf
rm -rf "$R/neuf" /tmp/sctalents.tar

# 3) Python, base, fichiers statiques
[ -d "$R/venv" ] || python3 -m venv "$R/venv"
"$R/venv/bin/pip" install -q -r "$R/app/requirements.txt"
set -a; . "$R/.env"; set +a
cd "$R/app"
"$R/venv/bin/python" manage.py migrate --noinput
"$R/venv/bin/python" manage.py collectstatic --noinput -v0
"$R/venv/bin/python" manage.py donnees_depart
chown -R sctalents:sctalents "$R/donnees" "$R/app"
chmod 755 "$R" "$R/donnees"

# 4) Services
systemctl daemon-reload
systemctl enable --now sctalents >/dev/null 2>&1
systemctl restart sctalents
ln -sf /etc/nginx/sites-available/sctalents.conf /etc/nginx/sites-enabled/sctalents.conf
nginx -t && systemctl reload nginx
sleep 2
curl -s -o /dev/null -w "site local : %{http_code}\n" -H "Host: $HOTE" http://127.0.0.1:8240/
