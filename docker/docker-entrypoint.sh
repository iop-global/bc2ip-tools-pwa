#!/bin/sh
set -e

echo "Setting application config based on environment variables"
for file in /usr/share/nginx/html/*.js;
do
  if [ ! -f $file.tmpl ]; then
    cp $file $file.tmpl
  fi

  # This replaces all environment variable in the given file.
  # If you have a MY_ENV environment var with the value of 42,
  # the $MY_ENV string in the file will be replaced to 42.
  # NOTE: if you have a environment variable that accidentally matches a variable in the file, that will be replaced too.
  envsubst '
    ${DOCKER_currentTenant},
    ${DOCKER_webService},
    ${DOCKER_hydraledgerNetwork},
  '  < $file.tmpl > $file
done

echo "Starting Nginx"
nginx -g 'daemon off;'
