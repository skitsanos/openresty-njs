#!/bin/bash

message() {
  [ $# -eq 2 ] && [ "$1" = "error" ] && printf "\n\033[31;47m[$1]:\033[0m $2\033[0m\n"
  [ $# -eq 2 ] && [ "$1" = "info" ] && printf "\n\033[38;42m[$1]:\033[0m $2\033[0m\n"
  [ $# -eq 1 ] && printf "\n\033[0m$1\n"
}

app_found() {
  if [ $# -ne 1 ]; then
    message "error" "Wrong number of arguments, expecting 1, ex: app_found <app_name>"
    exit 400
  fi

  if ! command -v $1 &>/dev/null; then
    return 1
  else
    return 0
  fi
}

# Check if script executed as root
if [ "$(id -u)" -ne 0 ]; then
  message "error" "Please run as root"
  exit 1
fi

message "info" "Checking for OS updates ..."

apt update -y
apt upgrade -y

message "info" "Installing build tools and dependencies ..."
apt install -y openssl curl ca-certificates zlib1g zlib1g-dev libxml2 libxml2-dev libxslt1.1 libxslt1-dev
apt install -y libpcre3-dev libssl-dev perl make build-essential

# Dependencies: xmlstarlet
message "info" "Checking for xmlstarlet utility ..."
if ! app_found xmlstarlet; then
  message 'info' 'Failed to find xmlstarlet. Installing...'
  apt install xmlstarlet -y
fi

# Dependencies: xpath
message "info" "Checking for xpath utility ..."
if ! app_found xpath; then
  message 'info' 'Failed to find xpath. Installing...'
  apt install libxml-xpath-perl -y
fi

#Dependencies: mercurial
message "info" "Checking for mercurial utility ..."
if ! app_found hg; then
  message 'info' 'Failed to find mercurial. Installing...'
  apt install mercurial -y
fi

# OpenResty
message "info" "Detecting OpenResty version..."
site="https://openresty.org/en/download.html"
downloadFile=$(curl -s $site | xmlstarlet fo -H -R -Q | xpath -q -e '(//li[parent::ul/preceding::h2/a/@id="lastest-release"]/a/text())[1]')
version=$(echo $downloadFile | perl -pe '($_)=/([0-9]+([.][0-9]+)+).{1}/')
#version=$(echo $downloadFile | awk -F"-" '{print $2}' | awk -F".tar.gz" '{print $1}')
if [ $version == "" ]; then
  message "error" "Failed to detect OpenResty version. Exiting"
  exit 500
fi

message "info" "Found $version"

#get OpenResty sources and drop archive into /sources folder
message "info" "Downloading OpenResty ..."
wget -c -P sources https://openresty.org/download/$downloadFile

cd sources

#get NJS sources
message "info" "Getting NJS sources ..."
rm -rf njs
hg clone http://hg.nginx.org/njs

message "info" "Getting OpenSSL sources ..."
rm -rf openssl
git clone git://git.openssl.org/openssl.git
cd openssl

message "info" "Building OpenSSL ..."
./configure
make

cd ..

message "info" "Unpacking OpenResty ..."
tar -xvf $downloadFile
cd openresty-$version

message "info" "Configuring OpenResty with NJS module ..."
./configure \
  --add-module=../njs/nginx \
  --with-cc-opt="-I/usr/local/opt/openssl/include/ -I/usr/local/opt/pcre/include/" \
  --with-ld-opt="-L/usr/local/opt/openssl/lib/ -L/usr/local/opt/pcre/lib/" \
  -j8

make install

echo $PWD
echo 'Add export PATH=/usr/local/openresty/bin:/usr/local/openresty/nginx/sbin:$PATH'

message "info" "Done!"
exit 0
