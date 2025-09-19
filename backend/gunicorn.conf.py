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