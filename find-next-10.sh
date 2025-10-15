#!/bin/bash

cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/culiacan"

# Properties to skip (from Lote 4)
skip_list=(
    "casa-en-venta-en-stanza-castilla-privada-avila"
    "casa-venta-acacia-kenya-992548"
    "casa-venta-albaterra-472517"
    "departamento-venta-banus"
    "casa-venta-banus-019512"
    "casa-venta-benevento-residencial-517819"
    "casa-venta-benevento-residencial-658194"
    "casa-venta-bonaterra-671323"
    "casa-venta-bosques-del-rio-221408"
    "casa-venta-bugambilias-520890"
    "casa-venta-casa-en-venta-prados-del-sur-pgXLMhK"
)

count=0
for dir in */; do
    dir_name="${dir%/}"

    # Skip if in skip list
    skip=0
    for skip_item in "${skip_list[@]}"; do
        if [[ "$dir_name" == "$skip_item" ]]; then
            skip=1
            break
        fi
    done

    if [ $skip -eq 1 ]; then
        continue
    fi

    # Check if index.html exists and doesn't have MARKER_CONFIG
    if [ -f "${dir}index.html" ]; then
        if ! grep -q "MARKER_CONFIG" "${dir}index.html"; then
            echo "$dir_name"
            count=$((count + 1))
            if [ $count -eq 10 ]; then
                break
            fi
        fi
    fi
done
