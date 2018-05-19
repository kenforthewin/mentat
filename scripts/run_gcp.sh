#!/bin/bash
docker-compose -f docker-compose.gcp.yml up --build -d
docker network connect nginx_network scalar_app_1
docker network connect bridge scalar_app_1
docker restart scalar_app_1