# BinPay Deployment Guide for InterServer

## Prerequisites
- InterServer VPS with Ubuntu/CentOS
- Domain name (optional but recommended)
- MongoDB Atlas account (or MongoDB on VPS)
- Paystack account

## Step 1: Server Setup

### 1.1 Connect to your InterServer VPS
```bash
ssh username@your-server-ip
```

### 1.2 Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Node.js 18+ and npm
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### 1.4 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 1.5 Install Nginx (Web Server)
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 1.6 Install Git
```bash
sudo apt install -y git
```

## Step 2: MongoDB Setup

### Option A: Use MongoDB Atlas (Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Whitelist your server IP

### Option B: Install MongoDB on VPS
```bash
sudo apt install -y mongodb
sudo systemctl enable mongodb
sudo systemctl start mongodb
```

## Step 3: Deploy Application

### 3.1 Clone or upload your project
```bash
cd /var/www
sudo mkdir binpay
sudo chown $USER:$USER binpay
cd binpay

# Upload your code via SFTP or Git
# For now, you'll need to transfer your files
```

### 3.2 Setup Backend
```bash
cd /var/www/binpay/backend

# Install dependencies
npm install

# Create production .env file
nano .env
```

Paste this configuration (update with your values):
```env
NODE_ENV=production
PORT=5000
API_URL=https://api.yourdomain.com

# MongoDB Atlas connection string or local MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/binpay?retryWrites=true&w=majority

# Generate strong secrets: openssl rand -base64 32
JWT_SECRET=YOUR_STRONG_JWT_SECRET_HERE
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=YOUR_REFRESH_SECRET_HERE
JWT_REFRESH_EXPIRES_IN=30d

# Paystack keys (get from https://dashboard.paystack.com/#/settings/developer)
PAYSTACK_SECRET_KEY=sk_live_your_real_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_real_public_key
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Super Admin
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123!
```

Build the backend:
```bash
npm run build
```

Seed the database:
```bash
npm run seed
```

Start with PM2:
```bash
pm2 start dist/server.js --name binpay-backend
pm2 save
pm2 startup
```

### 3.3 Setup Frontend
```bash
cd /var/www/binpay/frontend

# Install dependencies
npm install

# Create production .env file
nano .env.production
```

Add:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

Build the frontend:
```bash
npm run build
```

Start with PM2:
```bash
pm2 start npm --name binpay-frontend -- start
pm2 save
```

## Step 4: Configure Nginx

### 4.1 Create Nginx config for backend API
```bash
sudo nano /etc/nginx/sites-available/binpay-api
```

Paste:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.2 Create Nginx config for frontend
```bash
sudo nano /etc/nginx/sites-available/binpay-frontend
```

Paste:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3 Enable sites
```bash
sudo ln -s /etc/nginx/sites-available/binpay-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/binpay-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

Follow the prompts. Certbot will automatically configure SSL.

## Step 6: Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Step 7: DNS Configuration

In your domain registrar (or InterServer DNS):
- Create A record: `yourdomain.com` → Your server IP
- Create A record: `www.yourdomain.com` → Your server IP
- Create A record: `api.yourdomain.com` → Your server IP

## Step 8: Verify Deployment

1. Visit https://yourdomain.com - should show frontend
2. Visit https://api.yourdomain.com/health - should show backend status
3. Try logging in as super admin
4. Test the application

## Useful PM2 Commands

```bash
# View logs
pm2 logs binpay-backend
pm2 logs binpay-frontend

# Restart services
pm2 restart binpay-backend
pm2 restart binpay-frontend

# Stop services
pm2 stop binpay-backend
pm2 stop binpay-frontend

# View status
pm2 status

# Monitor
pm2 monit
```

## Updating the Application

```bash
# Pull latest changes
cd /var/www/binpay
git pull

# Update backend
cd backend
npm install
npm run build
pm2 restart binpay-backend

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart binpay-frontend
```

## Backup Strategy

### Database Backup (MongoDB Atlas)
- Automatic backups enabled by default

### Manual Backup
```bash
# Create backup script
sudo nano /usr/local/bin/backup-binpay.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/binpay

mkdir -p $BACKUP_DIR

# Backup code
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /var/www/binpay

# If using local MongoDB
mongodump --out $BACKUP_DIR/db_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-binpay.sh
```

Setup cron:
```bash
sudo crontab -e
```

Add daily backup at 2 AM:
```
0 2 * * * /usr/local/bin/backup-binpay.sh
```

## Troubleshooting

### Check if services are running
```bash
pm2 status
sudo systemctl status nginx
```

### View error logs
```bash
pm2 logs binpay-backend --err
pm2 logs binpay-frontend --err
sudo tail -f /var/log/nginx/error.log
```

### Database connection issues
- Check MongoDB Atlas IP whitelist
- Verify connection string in .env
- Test connection: `mongosh "your-connection-string"`

### Port already in use
```bash
sudo lsof -i :5000
sudo lsof -i :3000
```

## Security Checklist
- [ ] Strong passwords for all admin accounts
- [ ] JWT secrets are random and secure
- [ ] MongoDB credentials are secure
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Regular backups enabled
- [ ] Environment variables set correctly
- [ ] Paystack webhook secret configured
