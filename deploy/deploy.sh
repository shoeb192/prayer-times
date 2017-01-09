#!/bin/bash
if [ -z "$1" ]; then
echo "The version is mandatory";
exit 1
fi

mkdir -p /tmp/prayer
git archive $1 | (cd /tmp/prayer && tar xf -)
cd /tmp/prayer
echo $1 > version  
rsync -va --port 222 --delete --force --exclude-from "/home/keleyroot/perso/projects/prayer-times/deploy/exclude" ./ admin@192.168.1.14:/volume1/web/prayer

rm -rf /tmp/prayer/*