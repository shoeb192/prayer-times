#!/bin/bash
rsync -uva --delete --force --exclude-from "exclude" ../  izehhaf@192.168.1.14:~/www/prayer
