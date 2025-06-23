import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Database
} from 'lucide-react';
import apiService from '../services/api.js';
import { syncOperations } from '../services/db.js';

const ConnectionStatus = ({ showDetails = false, onSyncComplete }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiStatus, setApiStatus] = useState('unknown');
  const [pendingSync, setPendingSync] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    // Listeners para status de conexão
    const handleOnline = () => {
      setIsOnline(true);
      checkApiStatus();
      checkPendingSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setApiStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificações iniciais
    if (isOnline) {
      checkApiStatus();
      checkPendingSync();
    }

    // Verificar status periodicamente
    const interval = setInterval(() => {
      if (isOnline) {
        checkApiStatus();
        checkPendingSync();
      }
    }, 30000); // A cada 30 segundos

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  const checkApiStatus = async () => {
    try {
      const status = await apiService.checkApiStatus();
      setApiStatus(status ? 'connected' : 'error');
    } catch (error) {
      setApiStatus('error');
    }
  };

  const checkPendingSync = async () => {
    try {
      const pendingItems = await syncOperations.getPendingItems();
      setPendingSync(pendingItems.length);
    } catch (error) {
      console.error('Erro ao verificar itens pendentes:', error);
    }
  };

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      await apiService.syncPendingData();
      await checkPendingSync();
      setLastSyncTime(new Date());
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncError('Erro ao sincronizar dados');
    } finally {
      setIsSyncing(false);
    }
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (apiStatus === 'connected') return <Wifi className="h-4 w-4" />;
    if (apiStatus === 'error') return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getConnectionColor = () => {
    if (!isOnline) return 'destructive';
    if (apiStatus === 'connected') return 'default';
    if (apiStatus === 'error') return 'destructive';
    return 'secondary';
  };

  const getConnectionText = () => {
    if (!isOnline) return 'Offline';
    if (apiStatus === 'connected') return 'Online';
    if (apiStatus === 'error') return 'Erro na API';
    return 'Verificando...';
  };

  const getSyncStatusIcon = () => {
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (pendingSync === 0) return <CheckCircle className="h-4 w-4" />;
    return <Database className="h-4 w-4" />;
  };

  const getSyncStatusColor = () => {
    if (isSyncing) return 'secondary';
    if (pendingSync === 0) return 'default';
    return 'outline';
  };

  const getSyncStatusText = () => {
    if (isSyncing) return 'Sincronizando...';
    if (pendingSync === 0) return 'Sincronizado';
    return `${pendingSync} pendente${pendingSync > 1 ? 's' : ''}`;
  };

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={getConnectionColor()} className="flex items-center gap-1">
          {getConnectionIcon()}
          {getConnectionText()}
        </Badge>
        {pendingSync > 0 && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            {pendingSync}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        {/* Status de Conexão */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={getConnectionColor()} className="flex items-center gap-1">
              {getConnectionIcon()}
              {getConnectionText()}
            </Badge>
            {isOnline && apiStatus === 'connected' && (
              <span className="text-sm text-green-600">
                Conectado à API
              </span>
            )}
          </div>
          
          {isOnline && (
            <Button
              variant="outline"
              size="sm"
              onClick={checkApiStatus}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Verificar
            </Button>
          )}
        </div>

        {/* Status de Sincronização */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={getSyncStatusColor()} className="flex items-center gap-1">
              {getSyncStatusIcon()}
              {getSyncStatusText()}
            </Badge>
            {lastSyncTime && (
              <span className="text-sm text-gray-500">
                Última sync: {lastSyncTime.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </div>
          
          {isOnline && pendingSync > 0 && !isSyncing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Sincronizar
            </Button>
          )}
        </div>

        {/* Erro de Sincronização */}
        {syncError && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">{syncError}</span>
            </div>
          </div>
        )}

        {/* Informações Adicionais */}
        {!isOnline && (
          <div className="p-2 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-600">
                Modo offline ativo. Os dados serão sincronizados quando a conexão for restaurada.
              </span>
            </div>
          </div>
        )}

        {isOnline && apiStatus === 'error' && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">
                Não foi possível conectar à API. Verifique sua conexão ou tente novamente.
              </span>
            </div>
          </div>
        )}

        {isOnline && apiStatus === 'connected' && pendingSync === 0 && (
          <div className="p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">
                Todos os dados estão sincronizados com o servidor.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionStatus;

