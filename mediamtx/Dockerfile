FROM bluenviron/mediamtx:latest

COPY mediamtx.yml /mediamtx.yml

# RTMP — приймає потік від OBS
EXPOSE 1935/tcp

# HLS — роздає потік браузеру
EXPOSE 8888/tcp
