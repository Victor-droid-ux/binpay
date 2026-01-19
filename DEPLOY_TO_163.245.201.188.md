# BinPay Deployment - Your Server: 163.245.201.188

## Your Server Details
- **IP Address:** 163.245.201.188
- **SSH Command:** `ssh root@163.245.201.188`

## Step-by-Step Commands for YOUR Server

### 1. Connect to Your Server
Open PowerShell or CMD on your Windows machine:
```bash
ssh root@163.245.201.188
```
Enter your password when prompted.

---

### 2. Install Required Software (Copy and paste each block)

**Update system:**
```bash
apt update && apt upgrade -y
```

**Install Node.js 18:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

**Verify installation:**
```bash
node --version
npm --version
```

**Install PM2, Nginx, and Git:**
```bash
npm install -g pm2
apt install -y nginx git
systemctl enable nginx
systemctl start nginx
```

---

### 3. Create Project Directory
```bash
cd /var/www
mkdir binpay
chown $USER:$USER binpay
cd binpay
```

---

### 4. Upload Your Project Files

**Option A: Using WinSCP (Recommended for Windows)**
1. Download WinSCP: https://winscp.net/eng/download.php
2. Open WinSCP
3. New Site:
   - File protocol: SFTP
   - Host name: `163.245.201.188`
   - Port: 22
   - User name: `root`
   - Password: (your server password)
4. Click Login
5. Local side: Navigate to `C:\Users\USER\bin-pay-app`
6. Remote side: Navigate to `/var/www/binpay`
7. Drag and drop these folders to upload:
   - backend/
   - frontend/
   - ecosystem.config.js
   - deploy.sh

**Option B: Using Git (if you have a repository)**
```bash
cd /var/www/binpay
git clone YOUR_REPO_URL .
```

---

### 5. Setup MongoDB Atlas

1. Go to https://cloud.mongodb.com/
2. Create free account and cluster
3. In "Network Access", click "Add IP Address"
4. Add your server IP: **163.245.201.188**
5. Also add **0.0.0.0/0** (allow from anywhere) for testing
6. In "Database Access", create a user (remember username/password)
7. Click "Connect" → "Connect your application"
8. Copy the connection string, it looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/binpay?retryWrites=true&w=majority
   ```

---

### 6. Configure Backend Environment

```bash
cd /var/www/binpay/backend
nano .env
```

Paste this (replace the marked values):
```env
NODE_ENV=production
PORT=5000
API_URL=http://163.245.201.188:5000

# Replace with YOUR MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/binpay?retryWrites=true&w=majority

# Generate random secrets or use these temporarily
JWT_SECRET=binpay_jwt_secret_2026_production_key_change_this
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=binpay_refresh_secret_2026_production_key_change
JWT_REFRESH_EXPIRES_IN=30d

# Replace with YOUR Paystack LIVE keys from https://dashboard.paystack.com/#/settings/developer
PAYSTACK_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PUBLIC_KEY_HERE
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret

FRONTEND_URL=http://163.245.201.188:3000

SUPER_ADMIN_EMAIL=admin@binpay.ng
SUPER_ADMIN_PASSWORD=Admin123456!
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

---

### 7. Configure Frontend Environment

```bash
cd /var/www/binpay/frontend
nano .env.production
```

Paste this:
```env
NEXT_PUBLIC_API_URL=http://163.245.201.188:5000/api
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

---

### 8. Build and Deploy

```bash
cd /var/www/binpay

# Make deploy script executable
chmod +x deploy.sh

# Install backend dependencies
cd backend
npm install

# Build backend
npm run build

# Seed database
npm run seed

# Install frontend dependencies
cd ../frontend
npm install

# Build frontend
npm run build

# Go back to root
cd ..

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Copy and run the command that PM2 outputs (it will look like `sudo env PATH=$PATH:/usr/bin...`)

---

### 9. Configure Firewall

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 3000
ufw allow 5000
ufw --force enable
```

---

### 10. Access Your Application

**Frontend:** http://163.245.201.188:3000
**Backend API:** http://163.245.201.188:5000/api/health

**Super Admin Login:**
- Email: admin@binpay.ng
- Password: Admin123456!

**Test State Admins:**
- Lagos: lagos.admin@binpay.ng / Admin123456!
- FCT: fct.admin@binpay.ng / Admin123456!
- Enugu: enugu.admin@binpay.ng / Admin123456!

---

## Quick Commands Reference

**View logs:**
```bash
pm2 logs
```

**Restart services:**
```bash
pm2 restart all
```

**Check status:**
```bash
pm2 status
```

**Stop services:**
```bash
pm2 stop all
```

**Start services:**
```bash
pm2 start all
```

---

## After Testing (Optional): Setup Domain and SSL

### If you have a domain (e.g., binpay.ng):

1. **Point your domain DNS to your server:**
   - A record: `binpay.ng` → 163.245.201.188
   - A record: `www.binpay.ng` → 163.245.201.188
   - A record: `api.binpay.ng` → 163.245.201.188

2. **Update environment files:**
   ```bash
   # Backend
   nano /var/www/binpay/backend/.env
   # Change API_URL to: https://api.binpay.ng
   # Change FRONTEND_URL to: https://binpay.ng
   
   # Frontend
   nano /var/www/binpay/frontend/.env.production
   # Change to: NEXT_PUBLIC_API_URL=https://api.binpay.ng/api
   ```

3. **Configure Nginx:**
   ```bash
   nano /etc/nginx/sites-available/binpay
   ```
   
   Paste:
   ```nginx
   # Backend API
   server {
       listen 80;
       server_name api.binpay.ng;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   
   # Frontend
   server {
       listen 80;
       server_name binpay.ng www.binpay.ng;
       
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

4. **Enable site and install SSL:**
   ```bash
   ln -s /etc/nginx/sites-available/binpay /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   
   # Install SSL
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d binpay.ng -d www.binpay.ng -d api.binpay.ng
   ```

5. **Rebuild and restart:**
   ```bash
   cd /var/www/binpay
   ./deploy.sh
   ```

---

## Troubleshooting

**Can't access the site?**
```bash
# Check if services are running
pm2 status

# Check firewall
ufw status

# Check if ports are listening
netstat -tlnp | grep -E '3000|5000'
```

**Database connection error?**
- Make sure MongoDB Atlas has IP 163.245.201.188 whitelisted
- Or add 0.0.0.0/0 to allow all IPs
- Verify connection string in backend/.env

**Services keep crashing?**
```bash
pm2 logs --err
```

**Need to update after changes?**
```bash
cd /var/www/binpay
./deploy.sh
```

---

## Your Access URLs

- **Frontend:** http://163.245.201.188:3000
- **Backend Health:** http://163.245.201.188:5000/api/health
- **Admin Login:** http://163.245.201.188:3000/admin/login
- **Super Admin:** http://163.245.201.188:3000/super-admin/login

---

Good luck with your deployment! 🚀
