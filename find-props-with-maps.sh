#!/bin/bash

cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/culiacan"

count=0
for dir in */; do
    dir_name="${dir%/}"
    file="${dir}index.html"

    if [ -f "$file" ]; then
        # Check if has map section AND doesn't have MARKER_CONFIG
        if grep -q "maps.google.com\|map-container" "$file" 2>/dev/null; then
            if ! grep -q "MARKER_CONFIG" "$file" 2>/dev/null; then
                echo "$dir_name"
                count=$((count + 1))
                if [ $count -eq 20 ]; then
                    break
                fi
            fi
        fi
    fi
done
