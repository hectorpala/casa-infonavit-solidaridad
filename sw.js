// Service Worker para Hector es Bienes Raíces PWA
const CACHE_NAME = 'hector-bienes-raices-v1.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles-full.css',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/images/optimized/Logo-hector-es-bienes-raices.png',
  '/images/webp/Logo-hector-es-bienes-raices.webp',
  '/culiacan-infonavit-solidaridad/',
  '/culiacan-infonavit-solidaridad/index.html',
  '/culiacan-infonavit-solidaridad/styles.css',
  '/culiacan-infonavit-solidaridad/script.js',
  '/culiacan-infonavit-solidaridad/images/optimized/exterior-new.jpg',
  '/culiacan-infonavit-solidaridad/images/webp/exterior-new.webp',
  '/culiacan-infonavit-solidaridad/images/optimized/sala.jpg',
  '/culiacan-infonavit-solidaridad/images/webp/sala.webp',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Instalación del Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia de caché: Cache First con Network Fallback
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - devolver respuesta desde cache
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Verificar si recibimos una respuesta válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(function() {
        // Si falla la red y no está en cache, mostrar página offline
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
    );
});

// Manejo de notificaciones push (para futuras actualizaciones)
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pwa-icon-192x192.png',
      badge: '/pwa-icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver Propiedades',
          icon: '/pwa-icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/pwa-icon-192x192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/#propiedades')
    );
  } else if (event.action === 'close') {
    event.notification.close();
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});