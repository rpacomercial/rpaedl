import { openDB } from 'idb';

// Configurações do banco de dados
const DB_NAME = "RPA_CODE_DB";
const DB_VERSION = 2; // Incrementando a versão do DB

// Stores (tabelas) do banco
export const STORES = {
  EDLs: "edls",
  Inspections: "inspections",
  PendingSyncs: "pending_syncs",
  Settings: "settings"
};

// Inicializar banco de dados
export const initDB = async () => {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        // Store para EDLs
        if (!db.objectStoreNames.contains(STORES.EDLs)) {
          const edlStore = db.createObjectStore(STORES.EDLs, { 
            keyPath: "edlNumber" 
          });
          edlStore.createIndex("status", "status");
          edlStore.createIndex("location", "location");
          edlStore.createIndex("createdAt", "createdAt");
        } else if (oldVersion < 2 && newVersion >= 2) {
          // Migração para adicionar novos campos à EDL se a versão for menor que 2
          const edlStore = db.transaction(STORES.EDLs, 'readwrite').objectStore(STORES.EDLs);
          // Não é necessário criar índices aqui, apenas garantir que os dados sejam salvos com os novos campos
        }

        // Store para Inspeções
        if (!db.objectStoreNames.contains(STORES.Inspections)) {
          const inspectionStore = db.createObjectStore(STORES.Inspections, { 
            keyPath: "id", 
            autoIncrement: true 
          });
          inspectionStore.createIndex("edlNumber", "edlNumber");
          inspectionStore.createIndex("inspectorId", "inspectorId");
          inspectionStore.createIndex("createdAt", "createdAt");
          inspectionStore.createIndex("status", "status");
        }

        // Store para sincronização pendente
        if (!db.objectStoreNames.contains(STORES.PendingSyncs)) {
          const syncStore = db.createObjectStore(STORES.PendingSyncs, { 
            keyPath: "id", 
            autoIncrement: true 
          });
          syncStore.createIndex("type", "type");
          syncStore.createIndex("createdAt", "createdAt");
        }

        // Store para configurações
        if (!db.objectStoreNames.contains(STORES.Settings)) {
          db.createObjectStore(STORES.Settings, { 
            keyPath: "key" 
          });
        }
      },
    });

    console.log("Banco de dados inicializado com sucesso");
    return db;
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
    throw error;
  }
};

// Operações para EDLs
export const edlOperations = {
  // Criar nova EDL
  async create(edlData) {
    const db = await initDB();
    const tx = db.transaction(STORES.EDLs, 'readwrite');
    const store = tx.objectStore(STORES.EDLs);
    
    const edl = {
      ...edlData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active' // Pode ser 'active', 'inactive', etc.
    };
    
    await store.put(edl); // Usar put para atualizar se já existir
    await tx.complete;
    return edl;
  },

  // Buscar EDL por número
  async getByNumber(edlNumber) {
    const db = await initDB();
    const tx = db.transaction(STORES.EDLs, 'readonly');
    const store = tx.objectStore(STORES.EDLs);
    return await store.get(edlNumber);
  },

  // Listar todas as EDLs
  async getAll() {
    const db = await initDB();
    const tx = db.transaction(STORES.EDLs, 'readonly');
    const store = tx.objectStore(STORES.EDLs);
    return await store.getAll();
  },

  // Atualizar EDL
  async update(edlNumber, updates) {
    const db = await initDB();
    const tx = db.transaction(STORES.EDLs, 'readwrite');
    const store = tx.objectStore(STORES.EDLs);
    
    const existing = await store.get(edlNumber);
    if (!existing) {
      throw new Error('EDL não encontrada');
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await store.put(updated);
    await tx.complete;
    return updated;
  },

  // Deletar EDL
  async delete(edlNumber) {
    const db = await initDB();
    const tx = db.transaction(STORES.EDLs, 'readwrite');
    const store = tx.objectStore(STORES.EDLs);
    await store.delete(edlNumber);
    await tx.complete;
  }
};

// Operações para Inspeções
export const inspectionOperations = {
  // Criar nova inspeção
  async create(inspectionData) {
    const db = await initDB();
    const tx = db.transaction(STORES.Inspections, 'readwrite');
    const store = tx.objectStore(STORES.Inspections);
    
    const inspection = {
      ...inspectionData,
      createdAt: new Date().toISOString(),
      status: 'pending_sync' // Status inicial para sincronização
    };
    
    const result = await store.add(inspection);
    await tx.complete;
    
    // Adicionar à fila de sincronização
    await syncOperations.addToQueue('inspection', { ...inspection, id: result });
    
    return { ...inspection, id: result };
  },

  // Buscar inspeções por EDL
  async getByEdl(edlNumber) {
    const db = await initDB();
    const tx = db.transaction(STORES.Inspections, 'readonly');
    const store = tx.objectStore(STORES.Inspections);
    const index = store.index('edlNumber');
    return await index.getAll(edlNumber);
  },

  // Listar todas as inspeções
  async getAll() {
    const db = await initDB();
    const tx = db.transaction(STORES.Inspections, 'readonly');
    const store = tx.objectStore(STORES.Inspections);
    return await store.getAll();
  },

  // Atualizar status da inspeção
  async updateStatus(id, status) {
    const db = await initDB();
    const tx = db.transaction(STORES.Inspections, 'readwrite');
    const store = tx.objectStore(STORES.Inspections);
    
    const existing = await store.get(id);
    if (!existing) {
      throw new Error('Inspeção não encontrada');
    }

    const updated = {
      ...existing,
      status,
      updatedAt: new Date().toISOString()
    };

    await store.put(updated);
    await tx.complete;
    return updated;
  }
};

// Operações para sincronização
export const syncOperations = {
  // Adicionar item à fila de sincronização
  async addToQueue(type, data) {
    const db = await initDB();
    const tx = db.transaction(STORES.PendingSyncs, 'readwrite');
    const store = tx.objectStore(STORES.PendingSyncs);
    
    const syncItem = {
      type,
      data,
      createdAt: new Date().toISOString(),
      attempts: 0
    };
    
    await store.add(syncItem);
    await tx.complete;
  },

  // Obter itens pendentes de sincronização
  async getPendingItems() {
    const db = await initDB();
    const tx = db.transaction(STORES.PendingSyncs, 'readonly');
    const store = tx.objectStore(STORES.PendingSyncs);
    return await store.getAll();
  },

  // Remover item da fila após sincronização
  async removeFromQueue(id) {
    const db = await initDB();
    const tx = db.transaction(STORES.PendingSyncs, 'readwrite');
    const store = tx.objectStore(STORES.PendingSyncs);
    await store.delete(id);
    await tx.complete;
  },

  // Incrementar tentativas de sincronização
  async incrementAttempts(id) {
    const db = await initDB();
    const tx = db.transaction(STORES.PendingSyncs, 'readwrite');
    const store = tx.objectStore(STORES.PendingSyncs);
    
    const item = await store.get(id);
    if (item) {
      item.attempts += 1;
      item.lastAttempt = new Date().toISOString();
      await store.put(item);
    }
    
    await tx.complete;
  }
};

// Operações para configurações
export const settingsOperations = {
  // Salvar configuração
  async set(key, value) {
    const db = await initDB();
    const tx = db.transaction(STORES.Settings, 'readwrite');
    const store = tx.objectStore(STORES.Settings);
    
    await store.put({ key, value, updatedAt: new Date().toISOString() });
    await tx.complete;
  },

  // Obter configuração
  async get(key) {
    const db = await initDB();
    const tx = db.transaction(STORES.Settings, 'readonly');
    const store = tx.objectStore(STORES.Settings);
    const result = await store.get(key);
    return result ? result.value : null;
  },

  // Obter todas as configurações
  async getAll() {
    const db = await initDB();
    const tx = db.transaction(STORES.Settings, 'readonly');
    const store = tx.objectStore(STORES.Settings);
    const items = await store.getAll();
    
    const settings = {};
    items.forEach(item => {
      settings[item.key] = item.value;
    });
    
    return settings;
  }
};

// Função para limpar dados antigos (manutenção)
export const maintenance = {
  async cleanOldData(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffISO = cutoffDate.toISOString();

    const db = await initDB();
    
    // Limpar inspeções antigas sincronizadas
    const tx = db.transaction(STORES.Inspections, 'readwrite');
    const store = tx.objectStore(STORES.Inspections);
    const index = store.index('createdAt');
    
    const oldInspections = await index.getAll(IDBKeyRange.upperBound(cutoffISO));
    
    for (const inspection of oldInspections) {
      if (inspection.status === 'synced') {
        await store.delete(inspection.id);
      }
    }
    
    await tx.complete;
    console.log(`Limpeza concluída: ${oldInspections.length} registros antigos removidos`);
  }
};

// Exportar função de inicialização
export default initDB;


