import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Scan, 
  FileText, 
  Settings, 
  BarChart3,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { ConnectionStatus } from '../components';
import { inspectionOperations, edlOperations } from '../services/db.js';

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEdls: 0,
    totalInspections: 0,
    pendingInspections: 0,
    completedToday: 0
  });
  const [recentInspections, setRecentInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar estatísticas
      const [edls, inspections] = await Promise.all([
        edlOperations.getAll(),
        inspectionOperations.getAll()
      ]);

      const today = new Date().toDateString();
      const completedToday = inspections.filter(
        inspection => new Date(inspection.createdAt).toDateString() === today
      ).length;

      const pendingInspections = inspections.filter(
        inspection => inspection.status === 'pending' || inspection.status === 'in_progress'
      ).length;

      setStats({
        totalEdls: edls.length,
        totalInspections: inspections.length,
        pendingInspections,
        completedToday
      });

      // Carregar inspeções recentes (últimas 5)
      const recent = inspections
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      setRecentInspections(recent);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'synced':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'in_progress':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'synced':
        return 'Sincronizada';
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em Andamento';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const quickActions = [
    {
      title: 'Escanear QR Code',
      description: 'Ler código QR de uma EDL',
      icon: <Scan className="h-6 w-6" />,
      action: () => navigate('/scan'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Gerar QR Code',
      description: 'Criar novo código QR',
      icon: <QrCode className="h-6 w-6" />,
      action: () => navigate('/generate'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Nova Inspeção',
      description: 'Iniciar inspeção manual',
      icon: <Plus className="h-6 w-6" />,
      action: () => navigate('/inspection'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Relatórios',
      description: 'Ver relatórios e estatísticas',
      icon: <BarChart3 className="h-6 w-6" />,
      action: () => navigate('/reports'),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RPA CODE</h1>
              <p className="text-gray-600">Sistema de Controle de EDLs</p>
            </div>
            <div className="flex items-center gap-4">
              <ConnectionStatus />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de EDLs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEdls}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Inspeções</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInspections}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingInspections}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  className={`h-24 flex flex-col items-center justify-center gap-2 text-white ${action.color}`}
                >
                  {action.icon}
                  <div className="text-center">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-90">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inspeções Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Inspeções Recentes
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/reports')}
              >
                Ver Todas
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentInspections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma inspeção encontrada</p>
                <p className="text-sm">Comece escaneando um QR Code ou criando uma nova inspeção</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/inspection/${inspection.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(inspection.status)}
                      <div>
                        <p className="font-medium">EDL: {inspection.edlNumber}</p>
                        <p className="text-sm text-gray-600">
                          {inspection.inspectorName} • {new Date(inspection.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {getStatusText(inspection.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status de Sincronização */}
        <ConnectionStatus showDetails={true} onSyncComplete={loadDashboardData} />
      </main>
    </div>
  );
};

export default Home;

