#!/bin/bash
docker stop monique-frame
docker build -t monique-frame .
docker run -d --rm  --name monique-frame -p 8800:3000 monique-frame
