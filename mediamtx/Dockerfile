FROM bluenviron/mediamtx:latest-ffmpeg

COPY mediamtx.yml /mediamtx.yml

# RTMP — приймає потік від OBS
EXPOSE 1935/tcp

# HLS — роздає потік браузеру
EXPOSE 8888/tcp
