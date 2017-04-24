#!/bin/bash
if [ -z "$1" ]; then
echo "The version is mandatory";
exit 1
fi

rm -rf /home/www/prayer-times/$1
mkdir -p /home/www/prayer-times/$1

git archive $1 | (cd /home/www/prayer-times/$1 && tar xf -)
cd /home/www/prayer-times/$1
rm -rf doc README.md bin/deploy.sh downloads .gitignore
echo $1 > version
sed -i "s/<version>/$1/g" *.html

cd ..

rm -f current
ln -s $1 current

cd current/
rsync -va --port 222 --delete --force ./ izehhaf@izf.synology.me:~/web/prayer
