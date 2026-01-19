# BinPay - Quick Deployment Checklist

## Before Deployment

### 1. Get Your InterServer VPS Ready
- [ ] VPS is running Ubuntu 20.04+ or CentOS 8+
- [ ] You have root/sudo access
- [ ] You know your server IP address

### 2. Setup MongoDB
**Recommended: MongoDB Atlas (Free)**
- [ ] Create account at https://www.mongodb.com/cloud/atlas
- [ ] Create a free cluster
- [ ] Add your server IP to IP whitelist (or 0.0.0.0/0 for all)
- [ ] Create database user with password
- [ ] Copy connection string

### 3. Setup Paystack
- [ ] Create account at https://paystack.com
- [ ] Verify your business (for live keys)
- [ ] Get your **Live** Secret Key and Public Key from https://dashboard.paystack.com/#/settings/developer
- [ ] Note your webhook secret

### 4. Domain Setup (Optional but Recommended)
- [ ] Register a domain (or use subdomain from InterServer)
- [ ] Point DNS to your server IP:
  - A record: `yourdomain.com` → Server IP
  - A record: `www.yourdomain.com` → Server IP
  - A record: `api.yourdomain.com` → Server IP

## Deployment Steps

### Step 1: Connect to Server
```bash
ssh root@YOUR_SERVER_IP
```

### Step 2: Install Requirements (One-Time Setup)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2, Nginx, Git
sudo npm install -g pm2
sudo apt install -y nginx git

# Start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 3: Upload Your Project
```bash
# Create directory
cd /var/www
sudo mkdir binpay
sudo chown $USER:$USER binpay

# Upload via SFTP using FileZilla or WinSCP:
# - Host: YOUR_SERVER_IP
# - Username: root (or your user)
# - Password: your password
# - Remote path: /var/www/binpay
# Upload the entire bin-pay-app folder
```

### Step 4: Configure Backend
```bash
cd /var/www/binpay/backend

# Create .env file
nano .env
```

**Paste this (replace values):**
```env
NODE_ENV=production
PORT=5000
API_URL=https://api.yourdomain.com

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/binpay

JWT_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=zyx987wvu654tsr321qpo098nml765kji432hgf210edc
JWT_REFRESH_EXPIRES_IN=30d

PAYSTACK_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
PAYSTACK_PUBLIC_KEY=pk_live_YOUR_LIVE_PUBLIC_KEY
PAYSTACK_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

FRONTEND_URL=https://yourdomain.com

SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123!
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### Step 5: Configure Frontend
```bash
cd /var/www/binpay/frontend

# Create .env.production file
nano .env.production
```

**Paste this (replace domain):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### Step 6: Build and Deploy
```bash
cd /var/www/binpay

# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Step 7: Configure Nginx

**For API (Backend):**
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

**For Frontend:**
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

**Enable sites:**
```bash
sudo ln -s /etc/nginx/sites-available/binpay-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/binpay-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 8: Setup SSL (Free HTTPS)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

Follow prompts, enter email, agree to terms, choose redirect option.

### Step 9: Seed Database
```bash
cd /var/www/binpay/backend
npm run seed
```

### Step 10: Setup Firewall
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Testing

1. Visit `https://yourdomain.com` - Should show login page
2. Visit `https://api.yourdomain.com/api/health` - Should show backend status
3. Login with super admin credentials
4. Test bill payment flow

## Quick Commands

### View Logs
```bash
pm2 logs
pm2 logs binpay-backend
pm2 logs binpay-frontend
```

### Restart Services
```bash
pm2 restart all
```

### Check Status
```bash
pm2 status
```

### Update App After Changes
```bash
cd /var/www/binpay
git pull  # or re-upload via SFTP
./deploy.sh
```

## Troubleshooting

### Services not starting?
```bash
pm2 status
pm2 logs --err
```

### Database connection failed?
- Check MongoDB Atlas IP whitelist includes your server IP
- Verify connection string in backend/.env

### Frontend can't connect to backend?
- Check NEXT_PUBLIC_API_URL in frontend/.env.production
- Verify Nginx is running: `sudo systemctl status nginx`
- Check API is accessible: `curl http://localhost:5000/api/health`

### SSL certificate issues?
```bash
sudo certbot renew --dry-run
```

## Need Help?

Check the full guide: `DEPLOYMENT.md`

## Post-Deployment

- [ ] Test super admin login
- [ ] Test state admin login
- [ ] Test user registration
- [ ] Test bill payment
- [ ] Setup automated backups
- [ ] Configure Paystack webhooks
