.PHONY: build run stop logs clean

build:
	docker build -f mediamtx/Dockerfile -t streamlab-mediamtx ./mediamtx
	docker build -f site/Dockerfile.site -t streamlab-site ./site

run:
	docker run -d --name mediamtx \
		-p 1935:1935 \
		-p 8888:8888 \
		streamlab-mediamtx
	docker run -d --name site \
		-p 3000:80 \
		streamlab-site

stop:
	docker stop mediamtx site
	docker rm mediamtx site

logs:
	docker logs -f mediamtx

clean:
	docker rmi streamlab-mediamtx streamlab-site