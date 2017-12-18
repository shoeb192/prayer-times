#!/bin/bash
if [ -z "$1" ]; then
echo "The version is mandatory";
exit 1
fi

git push
git tag $1 -m "new release v$1"
git push --tags

rm -rf ~/www/prayer-times/$1
mkdir -p ~/www/prayer-times/$1

git archive $1 | (cd ~/www/prayer-times/$1 && tar xf -)
cd ~/www/prayer-times/$1
rm -rf doc README.md bin/deploy.sh downloads .gitignore
echo $1 > version
sed -i "s/<version>/$1/g" *.html

cd ..

rm -f current
ln -s $1 current

cd current/

tar -czf prayer.tar.gz *

scp -P 222 prayer.tar.gz izehhaf@izf.synology.me:/volume1/web/prayer