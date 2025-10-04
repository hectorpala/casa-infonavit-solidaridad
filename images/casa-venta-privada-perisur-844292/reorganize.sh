#!/bin/bash
mkdir -p temp
counter=1
for file in $(ls -lS *.jpg | awk '$5 > 30000 {print $9}'); do
    cp "$file" "temp/foto-$counter.jpg"
    counter=$((counter + 1))
done
rm foto-*.jpg
mv temp/* .
rmdir temp
echo "✅ Reorganizado: $(ls -1 foto-*.jpg | wc -l) fotos"
