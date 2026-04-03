#!/bin/bash

echo "🚀 Iniciando setup do ZScan Schedule..."

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Criado arquivo .env"
fi

# Gerar secrets aleatórios
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Atualizar .env com secrets gerados
sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
sed -i.bak "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env
sed -i.bak "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEXTAUTH_SECRET/" .env
rm -f .env.bak

echo "✅ Gerados secrets seguros"

# Criar estrutura base do NestJS
cd api
npm init -y
npx @nestjs/cli new . --skip-git --package-manager npm
cd ..

# Criar estrutura base do Next.js
cd web
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd ..

# Iniciar containers
echo "🐳 Iniciando containers Docker..."
docker-compose up -d --build

# Aguardar API ficar pronta
echo "⏳ Aguardando API iniciar..."
sleep 10

# Executar migrations iniciais
echo "📦 Executando migrations..."
docker exec zscan-api npm run typeorm migration:run

echo "✨ Setup concluído!"
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend: http://localhost:3000"
echo "📚 Swagger API: http://localhost:3000/api/docs"
echo "🗄️ PostgreSQL: localhost:5432"
echo "⚡ Redis: localhost:6379"