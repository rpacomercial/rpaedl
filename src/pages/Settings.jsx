import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  TestTube,
  Trash2,
  Download,
  Upload,
  Settings as SettingsIcon,
  Database,
  Wifi,
  Bell,
  Shield,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { ConnectionStatus } from '../components';
import { settingsOperations, maintenance } from '../services/db.js';
import apiService from '../services/api.js';

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    apiBaseUrl: 'https://api.saude.gov.br',
    apiTimeout: 30000,
    retryAttempts: 3,
    autoSync: true,
    notifications: true,
    offlineMode: false,
    dataRetentionDays: 30
  });
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const savedSettings = await settingsOperations.getAll();
      const user = await settingsOperations.get('userInfo');
      
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }
      
      if (user) {
        setUserInfo(user);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Salvar cada configuração individualmente
      for (const [key, value] of Object.entries(settings)) {
        await settingsOperations.set(key, value);
      }

      // Atualizar configurações da API
      await apiService.updateConfig({
        baseUrl: settings.apiBaseUrl,
        timeout: settings.apiTimeout,
        retryAttempts: settings.retryAttempts
      });

      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
    } finally {
      setIsSaving(false);
    }
  };

  const testApiConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      
      // Atualizar configurações temporariamente para teste
      await apiService.updateConfig({
        baseUrl: settings.apiBaseUrl,
        timeout: settings.apiTimeout,
        retryAttempts: settings.retryAttempts
      });

      const isConnected = await apiService.checkApiStatus();
      
      setTestResult({
        success: isConnected,
        message: isConnected 
          ? 'Conexão com a API estabelecida com sucesso!' 
          : 'Não foi possível conectar à API. Verifique a URL e sua conexão.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Erro ao testar conexão: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const clearAllData = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      // Aqui você implementaria a limpeza de dados
      // Por segurança, vamos apenas mostrar uma mensagem
      setMessage({ 
        type: 'success', 
        text: 'Função de limpeza de dados não implementada por segurança.' 
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao limpar dados.' });
    }
  };

  const runMaintenance = async () => {
    try {
      await maintenance.cleanOldData(settings.dataRetentionDays);
      setMessage({ 
        type: 'success', 
        text: 'Manutenção executada com sucesso! Dados antigos foram removidos.' 
      });
    } catch (error) {
      console.error('Erro na manutenção:', error);
      setMessage({ type: 'error', text: 'Erro ao executar manutenção.' });
    }
  };

  const exportData = async () => {
    try {
      // Implementar exportação de dados
      setMessage({ 
        type: 'success', 
        text: 'Função de exportação será implementada em breve.' 
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao exportar dados.' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
              <p className="text-gray-600">Gerencie as configurações do aplicativo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Mensagens */}
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Status de Conexão */}
        <ConnectionStatus showDetails={true} />

        {/* Configurações da API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Configurações da API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiBaseUrl">URL Base da API</Label>
              <Input
                id="apiBaseUrl"
                value={settings.apiBaseUrl}
                onChange={(e) => handleSettingChange('apiBaseUrl', e.target.value)}
                placeholder="https://api.saude.gov.br"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiTimeout">Timeout (ms)</Label>
                <Input
                  id="apiTimeout"
                  type="number"
                  value={settings.apiTimeout}
                  onChange={(e) => handleSettingChange('apiTimeout', parseInt(e.target.value))}
                  min="5000"
                  max="120000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retryAttempts">Tentativas de Retry</Label>
                <Input
                  id="retryAttempts"
                  type="number"
                  value={settings.retryAttempts}
                  onChange={(e) => handleSettingChange('retryAttempts', parseInt(e.target.value))}
                  min="1"
                  max="10"
                />
              </div>
            </div>

            {/* Teste de Conexão */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                onClick={testApiConnection}
                disabled={isTesting}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isTesting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                Testar Conexão
              </Button>

              {testResult && (
                <div className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sincronização Automática</Label>
                <p className="text-sm text-gray-600">
                  Sincronizar dados automaticamente quando online
                </p>
              </div>
              <Switch
                checked={settings.autoSync}
                onCheckedChange={(checked) => handleSettingChange('autoSync', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações</Label>
                <p className="text-sm text-gray-600">
                  Receber notificações do aplicativo
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo Offline</Label>
                <p className="text-sm text-gray-600">
                  Priorizar funcionamento offline
                </p>
              </div>
              <Switch
                checked={settings.offlineMode}
                onCheckedChange={(checked) => handleSettingChange('offlineMode', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="dataRetentionDays">Retenção de Dados (dias)</Label>
              <Input
                id="dataRetentionDays"
                type="number"
                value={settings.dataRetentionDays}
                onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value))}
                min="1"
                max="365"
              />
              <p className="text-sm text-gray-600">
                Dados sincronizados mais antigos que este período serão removidos automaticamente
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Usuário */}
        {userInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informações do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Nome</Label>
                <p className="text-gray-900">{userInfo.name || 'N/A'}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-gray-900">{userInfo.email || 'N/A'}</p>
              </div>
              <div>
                <Label>Função</Label>
                <p className="text-gray-900">{userInfo.role || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gerenciamento de Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gerenciamento de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={runMaintenance}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Executar Manutenção
              </Button>

              <Button
                onClick={exportData}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar Dados
              </Button>

              <Button
                onClick={clearAllData}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Dados
              </Button>
            </div>

            <p className="text-sm text-gray-600">
              <strong>Manutenção:</strong> Remove dados antigos conforme configuração de retenção.<br />
              <strong>Exportar:</strong> Cria backup dos dados locais.<br />
              <strong>Limpar:</strong> Remove todos os dados do aplicativo (irreversível).
            </p>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end">
          <Button
            onClick={saveSettings}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;

