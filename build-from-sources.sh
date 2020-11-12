#!/bin/sh

#get OpenResty sources and drop archive into /sources folder
wget -c -P sources https://openresty.org/download/openresty-1.19.3.1.tar.gz

cd sources

#get NJS sources
rm -rf njs
hg clone http://hg.nginx.org/njs

rm -rf openssl
git clone git://git.openssl.org/openssl.git
cd openssl
./configure
make

cd ..

tar -xvf openresty-1.19.3.1.tar.gz
cd openresty-1.19.3.1

./configure \
    --add-module=../njs/nginx \
    --with-cc-opt="-I/usr/local/opt/openssl/include/ -I/usr/local/opt/pcre/include/" \
    --with-ld-opt="-L/usr/local/opt/openssl/lib/ -L/usr/local/opt/pcre/lib/" \
    -j8

make install

echo $PWD
echo 'Add \n export PATH=/usr/local/openresty/bin:/usr/local/openresty/nginx/sbin:$PATH'