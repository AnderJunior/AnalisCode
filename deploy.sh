#!/bin/bash
# AnalisCode - Deploy Script para VPS
# Execute este script na VPS como root

set -e

DOMAIN="sites.analiscode.com"
APP_DIR="/var/www/analiscode"
DB_NAME="analiscode"
DB_USER="analiscode"
DB_PASS="AnalisCode@2024Prod"

echo "=========================================="
echo "  AnalisCode - Deploy na VPS"
echo "=========================================="

# 1. Atualizar sistema e instalar dependencias
echo ""
echo "[1/8] Instalando dependencias..."
apt update -y
apt install -y nginx mysql-server nodejs npm certbot python3-certbot-nginx unzip curl

# Instalar Node.js 20 se versao antiga
NODE_VER=$(node -v 2>/dev/null | cut -d. -f1 | tr -d 'v')
if [ "$NODE_VER" -lt 18 ] 2>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

# Instalar PM2
npm install -g pm2 2>/dev/null || true

# 2. Criar diretorio da aplicacao
echo ""
echo "[2/8] Criando diretorio da aplicacao..."
mkdir -p $APP_DIR
cd $APP_DIR

# 3. Configurar MySQL
echo ""
echo "[3/8] Configurando banco de dados..."
mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';" 2>/dev/null || true
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';" 2>/dev/null || true
mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true

# Importar schema
mysql $DB_NAME << 'EOSQL'
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  niche VARCHAR(100),
  thumbnail VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  review_token VARCHAR(64) UNIQUE NOT NULL,
  template_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  status ENUM('formulario_pendente','formulario_preenchido','em_edicao','aguardando_aprovacao','alteracao_solicitada','aprovado','publicado') DEFAULT 'formulario_pendente',
  form_data JSON,
  site_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

CREATE TABLE IF NOT EXISTS revisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  type ENUM('submit','revision_request','approval','publish') NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_token VARCHAR(64) NOT NULL,
  field_key VARCHAR(100) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_size INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin padrao (admin / admin123)
INSERT IGNORE INTO admins (username, password) VALUES ('admin', '$2b$10$8K1p/0J8ZkLxqKMXqLHJDe8wX5fEKzJ3m3E6UiE5Kz0hDO0hKzXaS');
EOSQL

echo "Banco configurado!"

# 4. Configurar Nginx
echo ""
echo "[4/8] Configurando Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << 'EONGINX'
server {
    listen 80;
    server_name sites.analiscode.com;

    # Frontend (arquivos estaticos)
    root /var/www/analiscode/frontend/dist;
    index index.html;

    # Arquivos estaticos do frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API e backend Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    # Templates estaticos
    location /templates/ {
        alias /var/www/analiscode/templates/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Uploads
    location /uploads/ {
        alias /var/www/analiscode/uploads/;
        expires 7d;
    }

    # Sites dos clientes
    location /sites/ {
        alias /var/www/analiscode/sites/;
        expires 1d;
    }

    # Form assets
    location /form/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EONGINX

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t && systemctl reload nginx

echo "Nginx configurado!"

# 5. Instalar dependencias Node.js
echo ""
echo "[5/8] Instalando dependencias do servidor..."
cd $APP_DIR/server
npm install --production

# 6. Configurar variaveis de ambiente
echo ""
echo "[6/8] Configurando ambiente de producao..."
cat > $APP_DIR/server/.env << EOF
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_NAME=$DB_NAME
APP_URL=https://$DOMAIN
SESSION_SECRET=$(openssl rand -hex 32)
EOF

# 7. Iniciar com PM2
echo ""
echo "[7/8] Iniciando aplicacao com PM2..."
cd $APP_DIR/server
pm2 delete analiscode 2>/dev/null || true
pm2 start server.js --name analiscode --env production
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# 8. SSL com Let's Encrypt
echo ""
echo "[8/8] Configurando SSL (HTTPS)..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@analiscode.com --redirect 2>/dev/null || echo "SSL sera configurado apos propagacao do DNS"

echo ""
echo "=========================================="
echo "  Deploy concluido!"
echo "=========================================="
echo ""
echo "  URL: https://$DOMAIN"
echo "  Admin: https://$DOMAIN/admin"
echo "  Login: admin / admin123"
echo ""
echo "  Comandos uteis:"
echo "    pm2 logs analiscode    - ver logs"
echo "    pm2 restart analiscode - reiniciar"
echo "    pm2 status             - verificar status"
echo ""
