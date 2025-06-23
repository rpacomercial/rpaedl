const CACHE_NAME = "rpa-code-v1";
const STATIC_CACHE = "rpa-code-static-v1";
const DYNAMIC_CACHE = "rpa-code-dynamic-v1";

// Recursos estáticos para cache
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/src/main.jsx",
  "/src/App.jsx",
  "/src/App.css",
  "/src/index.css"
];

// Instalar Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalando...");
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Cache aberto");
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error("Erro ao adicionar recursos ao cache:", error);
      })
  );
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Ativando...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log("Service Worker: Removendo cache antigo", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estratégia Cache First para recursos estáticos
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
    return;
  }

  // Estratégia Network First para APIs
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone da resposta para cache
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback para cache se offline
          return caches.match(request);
        })
    );
    return;
  }

  // Estratégia Cache First para outros recursos
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(request).then((response) => {
        // Não cachear se não for uma resposta válida
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone da resposta para cache
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});

// Background Sync para sincronização offline
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background Sync", event.tag);
  
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Aqui você pode implementar a lógica de sincronização
      syncOfflineData()
    );
  }
});

// Função para sincronizar dados offline
async function syncOfflineData() {
  try {
    // Implementar lógica de sincronização
    console.log("Sincronizando dados offline...");
    
    // Exemplo: buscar dados pendentes do IndexedDB e enviar para API
    const pendingData = await getPendingSyncData();
    
    for (const data of pendingData) {
      try {
        await fetch("/api/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        
        // Remover do IndexedDB após sincronização bem-sucedida
        await removeSyncedData(data.id);
      } catch (error) {
        console.error("Erro ao sincronizar dados:", error);
      }
    }
  } catch (error) {
    console.error("Erro na sincronização:", error);
  }
}

// Funções auxiliares (implementar conforme necessário)
async function getPendingSyncData() {
  // Implementar busca de dados pendentes no IndexedDB
  return [];
}

async function removeSyncedData(id) {
  // Implementar remoção de dados sincronizados do IndexedDB
  console.log("Dados sincronizados removidos:", id);
}

// Notificações Push (opcional)
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push recebido", event);
  
  const options = {
    body: event.data ? event.data.text() : "Nova notificação do RPA CODE",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: "explore",
        title: "Abrir App",
        icon: "/icons/icon-192x192.png"
      },
      {
        action: "close",
        title: "Fechar",
        icon: "/icons/icon-192x192.png"
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification("RPA CODE", options)
  );
});

// Clique em notificação
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notificação clicada", event);
  
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(
      clients.openWindow("/")
    );
  }
});

