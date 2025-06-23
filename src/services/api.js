import { settingsOperations, syncOperations, inspectionOperations } from './db.js';

// Configurações padrão da API
const DEFAULT_CONFIG = {
  baseUrl: 'https://api.saude.gov.br',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};

// Classe para gerenciar APIs
class ApiService {
  constructor() {
    this.config = DEFAULT_CONFIG;
    this.isOnline = navigator.onLine;
    this.setupNetworkListeners();
  }

  // Configurar listeners de rede
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Conexão restaurada - iniciando sincronização');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Conexão perdida - modo offline ativado');
    });
  }

  // Atualizar configurações da API
  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await settingsOperations.set('apiConfig', this.config);
  }

  // Carregar configurações salvas
  async loadConfig() {
    const savedConfig = await settingsOperations.get('apiConfig');
    if (savedConfig) {
      this.config = { ...this.config, ...savedConfig };
    }
  }

  // Fazer requisição HTTP com retry
  async makeRequest(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;
    
    const requestOptions = {
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Adicionar token de autenticação se disponível
    const authToken = await settingsOperations.get('authToken');
    if (authToken) {
      requestOptions.headers.Authorization = `Bearer ${authToken}`;
    }

    let lastError;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`Tentativa ${attempt} para ${fullUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(fullUrl, {
          ...requestOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data };

      } catch (error) {
        lastError = error;
        console.error(`Tentativa ${attempt} falhou:`, error.message);
        
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    return { success: false, error: lastError.message };
  }

  // Função auxiliar para delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Verificar status da API
  async checkApiStatus() {
    try {
      const result = await this.makeRequest('/health');
      return result.success;
    } catch (error) {
      console.error('Erro ao verificar status da API:', error);
      return false;
    }
  }

  // Autenticar usuário
  async authenticate(credentials) {
    try {
      const result = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (result.success && result.data.token) {
        await settingsOperations.set('authToken', result.data.token);
        await settingsOperations.set('userInfo', result.data.user);
        return { success: true, user: result.data.user };
      }

      return { success: false, error: 'Credenciais inválidas' };
    } catch (error) {
      console.error('Erro na autenticação:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout
  async logout() {
    await settingsOperations.set('authToken', null);
    await settingsOperations.set('userInfo', null);
  }

  // Buscar dados de EDL da API
  async getEdlData(edlNumber) {
    if (!this.isOnline) {
      throw new Error('Sem conexão com a internet');
    }

    const result = await this.makeRequest(`/edls/${edlNumber}`);
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || 'EDL não encontrada');
    }
  }

  // Enviar inspeção para API
  async submitInspection(inspectionData) {
    if (!this.isOnline) {
      // Adicionar à fila de sincronização se offline
      await syncOperations.addToQueue('inspection', inspectionData);
      return { success: true, queued: true };
    }

    const result = await this.makeRequest('/inspections', {
      method: 'POST',
      body: JSON.stringify(inspectionData)
    });

    if (result.success) {
      // Atualizar status da inspeção local
      if (inspectionData.id) {
        await inspectionOperations.updateStatus(inspectionData.id, 'synced');
      }
      return { success: true, data: result.data };
    } else {
      // Adicionar à fila se falhou
      await syncOperations.addToQueue('inspection', inspectionData);
      return { success: false, error: result.error, queued: true };
    }
  }

  // Sincronizar dados pendentes
  async syncPendingData() {
    if (!this.isOnline) {
      console.log('Sem conexão - sincronização adiada');
      return;
    }

    console.log('Iniciando sincronização de dados pendentes...');
    
    try {
      const pendingItems = await syncOperations.getPendingItems();
      console.log(`${pendingItems.length} itens pendentes para sincronização`);

      for (const item of pendingItems) {
        try {
          await syncOperations.incrementAttempts(item.id);

          let result;
          switch (item.type) {
            case 'inspection':
              result = await this.submitInspection(item.data);
              break;
            default:
              console.warn(`Tipo de sincronização desconhecido: ${item.type}`);
              continue;
          }

          if (result.success && !result.queued) {
            await syncOperations.removeFromQueue(item.id);
            console.log(`Item ${item.id} sincronizado com sucesso`);
          }

        } catch (error) {
          console.error(`Erro ao sincronizar item ${item.id}:`, error);
          
          // Remover da fila se muitas tentativas falharam
          if (item.attempts >= 5) {
            await syncOperations.removeFromQueue(item.id);
            console.log(`Item ${item.id} removido após 5 tentativas`);
          }
        }
      }

      console.log('Sincronização concluída');
    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  }

  // Buscar relatórios
  async getReports(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/reports${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await this.makeRequest(url);
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || 'Erro ao buscar relatórios');
    }
  }

  // Enviar feedback ou erro
  async sendFeedback(feedbackData) {
    const result = await this.makeRequest('/feedback', {
      method: 'POST',
      body: JSON.stringify({
        ...feedbackData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    });

    return result.success;
  }

  // Verificar atualizações do app
  async checkForUpdates() {
    try {
      const result = await this.makeRequest('/app/version');
      
      if (result.success) {
        const currentVersion = await settingsOperations.get('appVersion') || '1.0.0';
        const latestVersion = result.data.version;
        
        if (this.isNewerVersion(latestVersion, currentVersion)) {
          return {
            hasUpdate: true,
            currentVersion,
            latestVersion,
            updateInfo: result.data
          };
        }
      }
      
      return { hasUpdate: false };
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      return { hasUpdate: false };
    }
  }

  // Comparar versões
  isNewerVersion(latest, current) {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);
    
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;
      
      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }
    
    return false;
  }
}

// Instância singleton do serviço de API
const apiService = new ApiService();

// Inicializar configurações ao carregar
apiService.loadConfig();

// Exportar instância e classe
export default apiService;
export { ApiService };

