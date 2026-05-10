#!/bin/sh
set -e
envsubst '${VPS_IP} ${STREAM_KEY} ${RTMP_PORT} ${HLS_PORT}' \
  < /usr/share/nginx/html/config.js.template \
  > /usr/share/nginx/html/config.js
exec nginx -g 'daemon off;'
