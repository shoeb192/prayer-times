#!/bin/bash

if [ -z "$1" ]; then
echo "The version is mandatory";
exit 1
fi

mkdir -p /tmp/prayer
scp -r -P 222 admin@izf.synology.me:/volume1/web/prayer/* /tmp/prayer

cd /var/www/prayer

mkdir -p $1

mv /tmp/prayer/* $1

rm -f current

ln -s $1 current