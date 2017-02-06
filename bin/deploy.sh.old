#!/bin/bash
if [ -z "$1" ]; then
echo "The version is mandatory";
exit 1
fi

mkdir -p /tmp/prayer
rm -rf /tmp/prayer/*

git archive $1 | (cd /tmp/prayer && tar xf -)
cd /tmp/prayer

rm -rf doc README.md bin/deploy.sh

echo $1 > version
sed -i "s/<version>/$1/g" *.html
rsync -va --port 222 --delete --force ./ admin@izf.synology.me:/volume1/web/prayer
