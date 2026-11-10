#!/bin/bash
# Add H5P proxy location to nginx config if not already present
if ! grep -q 'h5p-static' /etc/nginx/conf.d/nocobase.conf 2>/dev/null; then
  sed -i '/location \^~ \/api\//i \
    # H5P static assets and embed page\
    location ^~ /h5p/ {\
        proxy_pass http://127.0.0.1:13000;\
        proxy_http_version 1.1;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $upstream_x_forwarded_proto;\
        proxy_set_header Host $final_host;\
        proxy_set_header Referer $http_referer;\
        proxy_set_header User-Agent $http_user_agent;\
        proxy_connect_timeout 600;\
        proxy_send_timeout 600;\
        proxy_read_timeout 600;\
        send_timeout 600;\
    }\
' /etc/nginx/conf.d/nocobase.conf
  nginx -s reload
  echo "[h5p] nginx config patched"
fi
