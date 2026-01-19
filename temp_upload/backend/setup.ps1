# Bin-Pay Backend Setup Script
# Run this script to set up the backend

Write-Host "🚀 Bin-Pay Backend Setup" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

# Check if PostgreSQL is running
Write-Host "`n📦 Step 1: Checking PostgreSQL..." -ForegroundColor Yellow
$pgStatus = Get-Process postgres -ErrorAction SilentlyContinue
if ($pgStatus) {
    Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL is not running. Please start PostgreSQL first." -ForegroundColor Red
    Write-Host "  Download from: https://www.postgresql.org/download/" -ForegroundColor Cyan
    exit 1
}

# Install dependencies
Write-Host "`n📦 Step 2: Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Check for .env file
Write-Host "`n📦 Step 3: Checking environment configuration..." -ForegroundColor Yellow
if (!(Test-Path .env)) {
    Write-Host "Creating .env file from template..." -ForegroundColor Cyan
    Copy-Item .env.example .env
    Write-Host "⚠ Please update .env file with your database credentials and API keys" -ForegroundColor Yellow
    Write-Host "  Required:" -ForegroundColor Cyan
    Write-Host "    - DATABASE_URL (PostgreSQL connection string)" -ForegroundColor Cyan
    Write-Host "    - JWT_SECRET (random secure string)" -ForegroundColor Cyan
    Write-Host "    - PAYSTACK_SECRET_KEY (from paystack.com)" -ForegroundColor Cyan
    
    $continue = Read-Host "`nHave you updated the .env file? (y/n)"
    if ($continue -ne 'y') {
        Write-Host "Please update .env and run this script again" -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "✓ .env file exists" -ForegroundColor Green
}

# Generate Prisma client
Write-Host "`n📦 Step 4: Generating Prisma client..." -ForegroundColor Yellow
npm run prisma:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma client generated" -ForegroundColor Green

# Run migrations
Write-Host "`n📦 Step 5: Running database migrations..." -ForegroundColor Yellow
npm run prisma:migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to run migrations" -ForegroundColor Red
    Write-Host "  Make sure your DATABASE_URL is correct in .env" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Database migrations completed" -ForegroundColor Green

# Seed database
Write-Host "`n📦 Step 6: Seeding database..." -ForegroundColor Yellow
npm run prisma:seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to seed database" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database seeded successfully" -ForegroundColor Green

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host "`nDefault Credentials:" -ForegroundColor Cyan
Write-Host "  Super Admin:" -ForegroundColor Yellow
Write-Host "    Email: admin@binpay.ng" -ForegroundColor White
Write-Host "    Password: Admin123!" -ForegroundColor White
Write-Host "`n  State Admins:" -ForegroundColor Yellow
Write-Host "    Lagos:  admin@lagos.binpay.ng / Admin123!" -ForegroundColor White
Write-Host "    FCT:    admin@fct.binpay.ng / Admin123!" -ForegroundColor White
Write-Host "    Enugu:  admin@enugu.binpay.ng / Admin123!" -ForegroundColor White
Write-Host "`nTo start the development server:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "`nServer will run at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
