# DEPLOYMENT WORKFLOW FOR NEITCLEM PROPERTY REVIEW MAKER

# login via ssh gratusinc-pr-neitclem@31.97.14.82 

# password: w3UINinvUgfk3efOWN4z

## Prerequisites Setup

### Create Folder Structure

```bash
mkdir -p /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/backend
mkdir -p /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/frontend
mkdir -p /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/media
mkdir -p /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/static
```

### Expected Folder Structure:
```
/home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/
├── frontend/         # React Vite app
│   └── dist/         # Production build output
├── backend/          # Django project
│   ├── manage.py
│   ├── pr_neitclem/
│   ├── venv/         # Virtual environment
│   ├── .env          # Environment variables
│   ├── gunicorn.conf.py
│   └── requirements.txt
├── static/           # Collected static files
└── media/            # Uploaded media files
```

---

## STEP 1: Frontend Deployment (React Vite)

### Build Frontend Locally
```bash
# On your local machine, navigate to your React project
cd your-react-project
npm ci
npm run build
```

### Update API Base URL
Before building, update your React app's API configuration:
```javascript

// In your React app (e.g., config.js or api.js)
const API_BASE_URL = 'https://pr-neitclem.gratusinc.org/api';
export default API_BASE_URL;
```

### Upload Frontend to Server
1. Navigate to CloudPanel → File Manager → htdocs → frontend
2. Drag and drop the entire `dist/` folder
3. Final path: `/home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/frontend/dist/`

---

## STEP 2: Backend Deployment (Django)

### Upload Backend Files
Upload these files to `/home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/backend/`:
- `manage.py`
- Your Django app folders (e.g., `pr_neitclem/`)
- `requirements.txt`

**Do NOT upload**: `venv/`, `__pycache__/`, `.git/`, `node_modules/`

### SSH Into Server & Setup Backend
```bash
# SSH into your server
ssh your-username@your-server-ip

# Navigate to backend directory
cd /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn mysqlclient python-dotenv
```

### Create Environment Variables
Create `.env` file in the backend directory:
```bash
# /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/backend/.env
SECRET_KEY=your-super-secret-key-here-make-it-long-and-random
DEBUG=False
DATABASE_NAME=pr_neitclem_db
DATABASE_USER=pr_neitclem_user
DATABASE_PASSWORD=your_secure_password
ALLOWED_HOSTS=pr-neitclem.gratusinc.org,www.pr-neitclem.gratusinc.org
CORS_ALLOWED_ORIGINS=https://pr-neitclem.gratusinc.org
```

### Create Gunicorn Configuration
Create `gunicorn.conf.py` in the backend directory:
```python
# /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/backend/gunicorn.conf.py
bind = "127.0.0.1:8091"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
reload = False
daemon = False
```

### Update Django Settings
Update your `settings.py` or create `settings/production.py`:
```python
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DATABASE_NAME'),
        'USER': os.getenv('DATABASE_USER'),
        'PASSWORD': os.getenv('DATABASE_PASSWORD'),
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'sql_mode': 'traditional',
        }
    }
}

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = '/home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/static/'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = '/home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/media/'

# CORS settings
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOW_CREDENTIALS = True

# Security settings for production
SECURE_SSL_REDIRECT = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

---

## STEP 3: Database Setup

### Create Database via CloudPanel
1. Go to CloudPanel → Databases → Add Database
2. **Database Name**: `pr_neitclem_db`
3. **Username**: `pr_neitclem_user` 
4. **Password**: `your_secure_password` (use a strong password)

### Run Database Operations
```bash
# Make sure you're in the backend directory with venv activated
cd /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/backend
source venv/bin/activate

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser (optional but recommended)
python manage.py createsuperuser
```

---

## STEP 4: Configure Nginx (Vhost)

Update your CloudPanel vhost configuration to this **corrected version**:

```nginx
server {
  listen 80;
  listen [::]:80;
  listen 443 quic;
  listen 443 ssl;
  listen [::]:443 quic;
  listen [::]:443 ssl;
  http2 on;
  http3 off;
  
  {{ssl_certificate_key}}
  {{ssl_certificate}}
  
  server_name pr-neitclem.gratusinc.org;
  root /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/frontend/dist;
  index index.html;
  
  {{nginx_access_log}}
  {{nginx_error_log}}
  
  if ($scheme != "https") {
    return 301 https://$host$request_uri;
  }
  
  location ~ /.well-known {
    auth_basic off;
    allow all;
  }
  
  {{settings}}
  include /etc/nginx/global_settings;
  
  # Django Admin (must be before /api/)
  location /admin/ {
    proxy_pass http://127.0.0.1:8091;
    proxy_http_version 1.1;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Server $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;
    proxy_pass_request_headers on;
  }
  
  # Django API (FIXED: no trailing slash)
  location /api/ {
    proxy_pass http://127.0.0.1:8091;
    proxy_http_version 1.1;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Server $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_pass_request_headers on;
    proxy_connect_timeout 900;
    proxy_send_timeout 900;
    proxy_read_timeout 900;
  }
  
  # Static files
  location /static/ {
    alias /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/static/;
    expires 30d;
    add_header Cache-Control "public, immutable";
  }
  
  # Media files
  location /media/ {
    alias /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/media/;
    expires 7d;
    add_header Cache-Control "public";
  }
  
  # Static assets with caching
  location ~* ^.+\.(css|js|jpg|jpeg|gif|png|ico|gz|svg|svgz|ttf|otf|woff|woff2|eot|mp4|ogg|ogv|webm|webp|zip|swf)$ {
    add_header Access-Control-Allow-Origin "*";
    expires max;
    access_log off;
  }
  
  # React frontend (must be last)
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

## STEP 5: Start Django Backend

### Option A: Using PM2 (Recommended)
```bash
# Install PM2 if not already installed
npm install -g pm2

# Navigate to backend directory
cd /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/backend
source venv/bin/activate

# Start with PM2 (CORRECTED command)
pm2 start "gunicorn --config gunicorn.conf.py pr_neitclem.wsgi:application" --name pr-neitclem-backend

# Save PM2 configuration
pm2 save
pm2 startup

# Check status
pm2 list
pm2 logs pr-neitclem-backend
```

### Option B: Using Systemd (Alternative)
Create `/etc/systemd/system/pr-neitclem.service`:
```ini
[Unit]
Description=PR NEITCLEM Django App
After=network.target

[Service]
User=clp
Group=clp
WorkingDirectory=/home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/backend
Environment="PATH=/home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/backend/venv/bin"
ExecStart=/home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/backend/venv/bin/gunicorn --config gunicorn.conf.py pr_neitclem.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable pr-neitclem
sudo systemctl start pr-neitclem
sudo systemctl status pr-neitclem
```

---

## STEP 6: Set File Permissions

```bash
# Set proper ownership and permissions
sudo chown -R clp:clp /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/
sudo chmod -R 755 /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/
sudo chmod -R 775 /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/media/
sudo chmod -R 755 /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/static/
```

---

## STEP 7: SSL Certificate

1. Go to CloudPanel → Sites → pr-neitclem.gratusinc.org → SSL/TLS
2. Install Let's Encrypt certificate
3. Verify HTTPS is working

---

## STEP 8: Testing Deployment

Test these URLs to verify everything is working:

### Frontend
- ✅ `https://pr-neitclem.gratusinc.org/` (React app should load)

### Backend API
- ✅ `https://pr-neitclem.gratusinc.org/api/` (Should show API response or 404 for root)
- ✅ `https://pr-neitclem.gratusinc.org/admin/` (Django admin login)

### Static Files
- ✅ `https://pr-neitclem.gratusinc.org/static/admin/css/base.css` (Should load CSS)

### Commands to Check Status
```bash
# Check PM2 status
pm2 list
pm2 logs pr-neitclem-backend

# Check nginx
sudo systemctl status nginx
sudo nginx -t

# Check if Django is running on port 8091
sudo netstat -tlnp | grep :8091

# Test Django directly (temporary)
curl http://127.0.0.1:8091/admin/
```

---

## STEP 9: Production Optimizations

### Setup Logging
```python
# Add to Django settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/backend/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

### Database Backup Script
Create `/home/gratusinc-pr-neitclem/backup_db.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u pr_neitclem_user -p pr_neitclem_db > /home/gratusinc-pr-neitclem/backups/db_$DATE.sql
```

---

## Troubleshooting

### Common Issues and Solutions

**1. API endpoints returning 404:**
- Check nginx configuration (no trailing slash in proxy_pass)
- Verify Django URLs are configured correctly
- Check if gunicorn is running on port 8091

**2. Static files not loading:**
- Run `python manage.py collectstatic --noinput`
- Check file permissions
- Verify nginx static file aliases

**3. Database connection errors:**
- Verify database credentials in .env
- Check if MySQL service is running
- Test database connection: `python manage.py dbshell`

**4. React app not loading:**
- Check if nginx is serving from correct directory
- Verify build was uploaded correctly
- Check browser console for errors

**5. PM2/Process issues:**
```bash
# Restart PM2 process
pm2 restart pr-neitclem-backend

# View detailed logs
pm2 logs pr-neitclem-backend --lines 100

# Check gunicorn config
gunicorn --check-config gunicorn.conf.py
```

### Useful Commands
```bash
# Reload nginx after config changes
sudo systemctl reload nginx

# Restart Django via PM2
pm2 restart pr-neitclem-backend

# View Django logs
tail -f /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/backend/django.log

# Check which process is using port 8091
sudo lsof -i :8091
```

---

## Maintenance

### Regular Tasks
1. **Database backups** - Set up automated daily backups
2. **Log rotation** - Configure logrotate for Django logs
3. **SSL renewal** - Let's Encrypt auto-renewal (CloudPanel handles this)
4. **Security updates** - Regular system updates
5. **Monitoring** - Set up monitoring for uptime and performance

### Update Deployment
When you have code changes:
```bash
# Frontend updates
npm run build
# Upload new dist/ folder

# Backend updates
cd /home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/backend
source venv/bin/activate
git pull  # or upload new files
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
pm2 restart pr-neitclem-backend
```

---
