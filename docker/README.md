## Build & Publish

```bash
$ docker build -f docker/DockerFile -t registry.iop-ventures.com/tresor/tools-webapp/app:latest .
```

```bash
$ docker push registry.iop-ventures.com/tresor/tools-webapp/app:latest
```

## Run

```bash
$ docker run -it --rm --name tresor-webapp --mount type=bind,src=${PWD}/docker/data/nginx,dst=/etc/nginx/conf.d -p 8080:8080 registry.iop-ventures.com/tresor/tools-webapp/app:latest
```
