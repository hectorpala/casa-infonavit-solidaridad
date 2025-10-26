const fs = require('fs');
const path = require('path');

/**
 * Sistema de Histórico de Propiedades
 * Rastrea: primera vez vista, última actualización, cambios de precio, estado
 */

class PropertyHistory {
    constructor(historyFile = 'property-history.json') {
        this.historyFile = historyFile;
        this.properties = new Map();
        this.load();
    }

    // Cargar histórico desde archivo
    load() {
        try {
            if (fs.existsSync(this.historyFile)) {
                const data = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));

                // Convertir array a Map
                if (Array.isArray(data.properties)) {
                    data.properties.forEach(prop => {
                        this.properties.set(prop.propertyId, prop);
                    });
                }

                console.log(`📚 Histórico cargado: ${this.properties.size} propiedades`);
            } else {
                console.log('📚 Histórico nuevo (archivo no existe)');
            }
        } catch (error) {
            console.error('Error cargando histórico:', error.message);
            this.properties = new Map();
        }
    }

    // Guardar histórico a archivo
    save() {
        try {
            const data = {
                lastUpdated: new Date().toISOString(),
                totalProperties: this.properties.size,
                properties: Array.from(this.properties.values())
            };

            fs.writeFileSync(this.historyFile, JSON.stringify(data, null, 2), 'utf8');
            console.log(`💾 Histórico guardado: ${this.properties.size} propiedades`);
        } catch (error) {
            console.error('Error guardando histórico:', error.message);
        }
    }

    // Registrar o actualizar propiedad
    track(propertyData) {
        const {
            propertyId,
            url,
            title,
            price,
            daysOld,
            ageText
        } = propertyData;

        const now = Date.now();
        const existing = this.properties.get(propertyId);

        if (existing) {
            // Actualizar propiedad existente
            const updated = {
                ...existing,
                lastSeen: now,
                lastSeenDate: new Date().toISOString(),
                scrapedCount: existing.scrapedCount + 1,
                url: url || existing.url,
                title: title || existing.title
            };

            // Detectar cambio de precio
            if (price && price !== existing.currentPrice) {
                updated.priceHistory = updated.priceHistory || [];
                updated.priceHistory.push({
                    price: existing.currentPrice,
                    date: existing.lastSeenDate
                });
                updated.currentPrice = price;
                updated.priceChanged = true;
                console.log(`💰 Cambio de precio detectado: ${propertyId} - ${existing.currentPrice} → ${price}`);
            }

            // Actualizar antigüedad si está disponible
            if (daysOld !== null && daysOld !== undefined) {
                updated.daysOld = daysOld;
                updated.ageText = ageText;
            }

            this.properties.set(propertyId, updated);
            return { isNew: false, updated: true, property: updated };

        } else {
            // Nueva propiedad
            const newProperty = {
                propertyId,
                url: url || '',
                title: title || '',
                currentPrice: price || null,
                priceHistory: [],
                daysOld: daysOld,
                ageText: ageText,
                firstSeen: now,
                firstSeenDate: new Date().toISOString(),
                lastSeen: now,
                lastSeenDate: new Date().toISOString(),
                scrapedCount: 1,
                priceChanged: false
            };

            this.properties.set(propertyId, newProperty);
            console.log(`🆕 Nueva propiedad registrada: ${propertyId}`);
            return { isNew: true, updated: false, property: newProperty };
        }
    }

    // Obtener propiedad por ID
    get(propertyId) {
        return this.properties.get(propertyId);
    }

    // Verificar si una propiedad es reciente (≤ N días desde primera vez vista)
    isRecentProperty(propertyId, maxDays = 20) {
        const property = this.properties.get(propertyId);
        if (!property) return true; // Si no existe, asumir reciente

        const daysSinceFirstSeen = (Date.now() - property.firstSeen) / (1000 * 60 * 60 * 24);
        return daysSinceFirstSeen <= maxDays;
    }

    // Filtrar propiedades recientes (≤ N días)
    getRecentProperties(maxDays = 20) {
        const recent = [];
        const now = Date.now();

        for (const [id, prop] of this.properties.entries()) {
            const daysSinceFirstSeen = (now - prop.firstSeen) / (1000 * 60 * 60 * 24);

            if (daysSinceFirstSeen <= maxDays) {
                recent.push({
                    ...prop,
                    daysSinceFirstSeen: Math.floor(daysSinceFirstSeen)
                });
            }
        }

        return recent.sort((a, b) => b.firstSeen - a.firstSeen);
    }

    // Obtener propiedades con cambio de precio
    getPropertiesWithPriceChanges() {
        return Array.from(this.properties.values())
            .filter(p => p.priceChanged)
            .sort((a, b) => b.lastSeen - a.lastSeen);
    }

    // Marcar propiedad como scrapeada
    markAsScraped(propertyId) {
        const property = this.properties.get(propertyId);
        if (property) {
            property.scraped = true;
            property.scrapedDate = new Date().toISOString();
            this.properties.set(propertyId, property);
        }
    }

    // Obtener estadísticas
    getStats() {
        const total = this.properties.size;
        const recent20 = this.getRecentProperties(20).length;
        const recent15 = this.getRecentProperties(15).length;
        const priceChanges = this.getPropertiesWithPriceChanges().length;

        const scraped = Array.from(this.properties.values()).filter(p => p.scraped).length;

        return {
            total,
            recent20,
            recent15,
            priceChanges,
            scraped,
            unscraped: total - scraped
        };
    }

    // Limpiar propiedades antiguas (>30 días sin ver)
    cleanOldProperties(daysThreshold = 30) {
        const now = Date.now();
        const threshold = daysThreshold * 24 * 60 * 60 * 1000;
        let removed = 0;

        for (const [id, prop] of this.properties.entries()) {
            if ((now - prop.lastSeen) > threshold) {
                this.properties.delete(id);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`🗑️  Limpieza: ${removed} propiedades antiguas eliminadas`);
            this.save();
        }

        return removed;
    }

    // Exportar a CSV
    exportToCSV(filename = 'property-history.csv') {
        const headers = 'propertyId,url,title,currentPrice,firstSeen,lastSeen,scrapedCount,priceChanged\n';
        const rows = Array.from(this.properties.values())
            .map(p => `"${p.propertyId}","${p.url}","${p.title}","${p.currentPrice || ''}","${p.firstSeenDate}","${p.lastSeenDate}",${p.scrapedCount},${p.priceChanged}`)
            .join('\n');

        fs.writeFileSync(filename, headers + rows, 'utf8');
        console.log(`📊 Histórico exportado a CSV: ${filename}`);
    }

    // Generar reporte de propiedades nuevas (últimas 24 horas)
    getNewPropertiesReport() {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const newProps = Array.from(this.properties.values())
            .filter(p => p.firstSeen > oneDayAgo)
            .sort((a, b) => b.firstSeen - a.firstSeen);

        return {
            count: newProps.length,
            properties: newProps
        };
    }
}

module.exports = PropertyHistory;
