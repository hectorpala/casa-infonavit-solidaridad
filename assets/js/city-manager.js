// City Manager - Gestor de ciudades para casasenventa.info
class CityManager {
    constructor() {
        this.cities = {};
        this.currentCity = null;
        this.propertiesData = {};
        this.init();
    }

    async init() {
        try {
            // Cargar configuración de ciudades
            const citiesResponse = await fetch('/data/cities.json');
            const citiesData = await citiesResponse.json();
            this.cities = citiesData.cities;
            this.globalConfig = citiesData.globalConfig;
        } catch (error) {
            console.error('Error loading cities data:', error);
        }
    }

    async initializeCity(citySlug) {
        this.currentCity = citySlug;
        
        try {
            // Cargar propiedades de la ciudad
            const propertiesResponse = await fetch(`/${citySlug}/data/properties.json`);
            const propertiesData = await propertiesResponse.json();
            this.propertiesData[citySlug] = propertiesData;
            
            // Renderizar contenido dinámico
            this.renderCityContent(citySlug);
            this.renderNeighborhoods(citySlug);
            this.renderProperties(citySlug);
            
        } catch (error) {
            console.error(`Error loading data for ${citySlug}:`, error);
        }
    }

    renderCityContent(citySlug) {
        const city = this.cities[citySlug];
        if (!city) return;

        // Actualizar título de la página
        document.title = `Casas en Venta en ${city.name}, ${city.state} | Hector es Bienes Raíces`;
        
        // Actualizar meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = `Descubre las mejores casas en venta en ${city.name}, ${city.state}. ${city.totalProperties}+ propiedades disponibles. Precios competitivos y calidad garantizada.`;
        }

        // Actualizar contenido dinámico
        const elements = {
            'city-properties-count': city.totalProperties,
            'city-name': city.name,
            'city-features': city.features
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Actualizar hero background
        const hero = document.querySelector('.hero-city');
        if (hero && city.heroImage) {
            hero.style.backgroundImage = `url('../assets/images/cities/${citySlug}/${city.heroImage}')`;
        }
    }

    renderNeighborhoods(citySlug) {
        const city = this.cities[citySlug];
        const container = document.getElementById('neighborhoods-container');
        
        if (!container || !city.neighborhoods) return;

        const neighborhoodsHTML = city.neighborhoods.map(neighborhood => `
            <div class="neighborhood-card">
                <div class="neighborhood-image">
                    <img src="../assets/images/neighborhoods/${neighborhood.slug}.jpg" 
                         alt="${neighborhood.name}" 
                         onerror="this.src='../assets/images/global/placeholder-neighborhood.jpg'">
                </div>
                <div class="neighborhood-info">
                    <h3>${neighborhood.name}</h3>
                    <p>${neighborhood.description}</p>
                    <div class="neighborhood-stats">
                        <span class="stat">
                            <i class="fas fa-home"></i>
                            ${neighborhood.properties} propiedades
                        </span>
                        <span class="stat">
                            <i class="fas fa-dollar-sign"></i>
                            Desde $${this.formatPrice(neighborhood.averagePrice)}
                        </span>
                    </div>
                    <a href="${neighborhood.slug}/" class="neighborhood-cta">
                        Ver Propiedades
                    </a>
                </div>
            </div>
        `).join('');

        container.innerHTML = neighborhoodsHTML;
    }

    renderProperties(citySlug, limit = 6) {
        const propertiesData = this.propertiesData[citySlug];
        const container = document.getElementById('properties-container');
        
        if (!container || !propertiesData) return;

        const properties = propertiesData.properties.slice(0, limit);
        
        const propertiesHTML = properties.map(property => `
            <a href="${property.neighborhoodSlug}/${property.slug}/" class="property-card">
                <div class="property-image">
                    <img src="../assets/images/properties/${property.slug}/${property.images.main}" 
                         alt="${property.title}" 
                         loading="lazy"
                         onerror="this.src='../assets/images/global/placeholder-property.jpg'">
                    <div class="property-badge ${property.listingType}">
                        ${property.listingTypeLabel}
                    </div>
                </div>
                <div class="property-content">
                    <h3 class="property-title">${property.title}</h3>
                    <p class="property-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${property.address}, ${property.neighborhood}
                    </p>
                    <div class="property-price">$${property.price}</div>
                    <div class="property-features">
                        <span class="feature">
                            <i class="fas fa-bed"></i> ${property.specifications.bedrooms} Recámaras
                        </span>
                        <span class="feature">
                            <i class="fas fa-bath"></i> ${property.specifications.bathrooms} Baños
                        </span>
                        <span class="feature">
                            <i class="fas fa-car"></i> ${property.specifications.parkingSpots} Autos
                        </span>
                        <span class="feature">
                            <i class="fas fa-ruler-combined"></i> ${property.specifications.builtArea} m²
                        </span>
                    </div>
                    <div class="property-cta">Ver Detalles Completos</div>
                </div>
            </a>
        `).join('');

        container.innerHTML = propertiesHTML;

        // Mostrar/ocultar botón "Ver más"
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            if (propertiesData.properties.length > limit) {
                loadMoreBtn.style.display = 'block';
                loadMoreBtn.onclick = () => this.loadMoreProperties(citySlug);
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    }

    loadMoreProperties(citySlug) {
        const currentCount = document.querySelectorAll('#properties-container .property-card').length;
        this.renderProperties(citySlug, currentCount + 6);
    }

    formatPrice(price) {
        if (price >= 1000000) {
            return (price / 1000000).toFixed(1) + 'M';
        } else if (price >= 1000) {
            return (price / 1000).toFixed(0) + 'K';
        }
        return price.toString();
    }

    // Método para búsqueda de propiedades
    searchProperties(citySlug, filters = {}) {
        const propertiesData = this.propertiesData[citySlug];
        if (!propertiesData) return [];

        let filteredProperties = propertiesData.properties;

        // Filtrar por tipo (venta/renta)
        if (filters.type) {
            filteredProperties = filteredProperties.filter(p => p.listingType === filters.type);
        }

        // Filtrar por rango de precio
        if (filters.minPrice || filters.maxPrice) {
            filteredProperties = filteredProperties.filter(p => {
                const price = p.priceNumeric;
                const minOk = !filters.minPrice || price >= filters.minPrice;
                const maxOk = !filters.maxPrice || price <= filters.maxPrice;
                return minOk && maxOk;
            });
        }

        // Filtrar por recámaras
        if (filters.bedrooms) {
            filteredProperties = filteredProperties.filter(p => 
                p.specifications.bedrooms >= filters.bedrooms
            );
        }

        // Filtrar por colonia
        if (filters.neighborhood) {
            filteredProperties = filteredProperties.filter(p => 
                p.neighborhoodSlug === filters.neighborhood
            );
        }

        return filteredProperties;
    }

    // Método para obtener propiedades relacionadas
    getRelatedProperties(propertyId, citySlug, limit = 3) {
        const propertiesData = this.propertiesData[citySlug];
        if (!propertiesData) return [];

        const currentProperty = propertiesData.properties.find(p => p.id === propertyId);
        if (!currentProperty) return [];

        // Buscar propiedades en la misma colonia
        let related = propertiesData.properties.filter(p => 
            p.id !== propertyId && 
            p.neighborhoodSlug === currentProperty.neighborhoodSlug
        );

        // Si no hay suficientes, buscar en la misma ciudad
        if (related.length < limit) {
            const additional = propertiesData.properties.filter(p => 
                p.id !== propertyId && 
                p.neighborhoodSlug !== currentProperty.neighborhoodSlug
            );
            related = related.concat(additional);
        }

        return related.slice(0, limit);
    }

    // Generar breadcrumbs dinámicos
    generateBreadcrumbs(city, neighborhood = null, property = null) {
        const breadcrumbs = [
            { name: 'Inicio', url: '/' },
            { name: this.cities[city]?.name || city, url: `/${city}/` }
        ];

        if (neighborhood) {
            breadcrumbs.push({
                name: neighborhood,
                url: `/${city}/${neighborhood}/`
            });
        }

        if (property) {
            breadcrumbs.push({
                name: property,
                url: null // Current page
            });
        }

        return breadcrumbs;
    }

    // Actualizar sitemap dinámicamente
    updateSitemap() {
        // Este método se ejecutaría en el servidor para actualizar sitemap.xml
        // con las nuevas URLs de ciudades y propiedades
    }
}

// Funcionalidad global para todas las páginas
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar menú hamburguesa (heredado)
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav');
    
    if (hamburger && nav) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
            
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
        });
        
        // Cerrar menú al hacer clic en enlaces
        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                hamburger.setAttribute('aria-expanded', false);
            });
        });
        
        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                hamburger.setAttribute('aria-expanded', false);
            }
        });
    }

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header background on scroll
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (header) {
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
            }
        }
    });
});