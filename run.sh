#!/bin/sh
clear

#Restart OpenResty
#kill -QUIT $(cat /usr/local/var/run/openresty.pid)
kill $(pgrep nginx)

/usr/local/openresty/bin/openresty -p $PWD -c $PWD/conf/nginx.conf -g "daemon off;"