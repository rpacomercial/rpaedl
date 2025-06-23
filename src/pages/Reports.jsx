import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Download,
  FileText,
  Filter,
  Calendar,
  BarChart3,
  Eye,
  Search,
  RefreshCw
} from 'lucide-react';
import { inspectionOperations, edlOperations } from '../services/db.js';
import pdfService from '../services/pdf.js';

const Reports = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [edls, setEdls] = useState([]);
  const [filteredInspections, setFilteredInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    edlNumber: '',
    localInstalacao: '', // Novo filtro
    endereco: '', // Novo filtro
    responsavel: '' // Novo filtro
  });

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    synced: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inspections, filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [inspectionsData, edlsData] = await Promise.all([
        inspectionOperations.getAll(),
        edlOperations.getAll()
      ]);

      setInspections(inspectionsData);
      setEdls(edlsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...inspections];

    // Filtro por data de início
    if (filters.startDate) {
      filtered = filtered.filter(
        inspection => new Date(inspection.createdAt) >= new Date(filters.startDate)
      );
    }

    // Filtro por data de fim
    if (filters.endDate) {
      filtered = filtered.filter(
        inspection => new Date(inspection.createdAt) <= new Date(filters.endDate)
      );
    }

    // Filtro por status
    if (filters.status) {
      filtered = filtered.filter(inspection => inspection.status === filters.status);
    }

    // Filtro por número da EDL
    if (filters.edlNumber) {
      filtered = filtered.filter(
        inspection => inspection.edlNumber.toLowerCase().includes(filters.edlNumber.toLowerCase())
      );
    }

    // Filtro por local de instalação
    if (filters.localInstalacao) {
      filtered = filtered.filter(
        inspection => inspection.localInstalacao?.toLowerCase().includes(filters.localInstalacao.toLowerCase())
      );
    }

    // Filtro por endereço
    if (filters.endereco) {
      filtered = filtered.filter(
        inspection => inspection.endereco?.toLowerCase().includes(filters.endereco.toLowerCase())
      );
    }

    // Filtro por responsável
    if (filters.responsavel) {
      filtered = filtered.filter(
        inspection => inspection.responsavel?.toLowerCase().includes(filters.responsavel.toLowerCase())
      );
    }

    setFilteredInspections(filtered);

    // Calcular estatísticas
    const stats = {
      total: filtered.length,
      completed: filtered.filter(i => i.status === 'completed').length,
      pending: filtered.filter(i => i.status === 'pending' || i.status === 'in_progress').length,
      synced: filtered.filter(i => i.status === 'synced').length
    };
    setStats(stats);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      edlNumber: '',
      localInstalacao: '',
      endereco: '',
      responsavel: ''
    });
  };

  const generateConsolidatedReport = async () => {
    try {
      setIsGeneratingPDF(true);
      await pdfService.generateAndSaveConsolidatedReport(filters);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generateInspectionReport = async (inspectionId) => {
    try {
      await pdfService.generateAndSaveInspectionReport(inspectionId);
    } catch (error) {
      console.error('Erro ao gerar relatório da inspeção:', error);
      alert('Erro ao gerar relatório da inspeção');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'synced':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
                <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
                <p className="text-gray-600">Visualize e exporte relatórios de inspeções</p>
              </div>
            </div>
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Concluídas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sincronizadas</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.synced}</p>
                </div>
                <Download className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="synced">Sincronizada</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edlNumber">EDL</Label>
                <Input
                  id="edlNumber"
                  placeholder="Número da EDL"
                  value={filters.edlNumber}
                  onChange={(e) => handleFilterChange('edlNumber', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="localInstalacao">Local de Instalação</Label>
                <Input
                  id="localInstalacao"
                  placeholder="Local de Instalação"
                  value={filters.localInstalacao}
                  onChange={(e) => handleFilterChange('localInstalacao', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  placeholder="Endereço"
                  value={filters.endereco}
                  onChange={(e) => handleFilterChange('endereco', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  placeholder="Nome do Responsável"
                  value={filters.responsavel}
                  onChange={(e) => handleFilterChange('responsavel', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Limpar Filtros
              </Button>
              <Button
                onClick={generateConsolidatedReport}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2"
              >
                {isGeneratingPDF ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Gerar Relatório PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Inspeções */}
        <Card>
          <CardHeader>
            <CardTitle>Inspeções ({filteredInspections.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInspections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma inspeção encontrada</p>
                <p className="text-sm">Ajuste os filtros ou realize novas inspeções</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="font-medium">EDL: {inspection.edlNumber}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(inspection.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Local Instalação</p>
                        <p className="font-medium">{inspection.localInstalacao || 'N/A'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Endereço</p>
                        <p className="font-medium">{inspection.endereco || 'N/A'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Responsável</p>
                        <p className="font-medium">{inspection.responsavel || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <Badge className={getStatusColor(inspection.status)}>
                          {getStatusText(inspection.status)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateInspectionReport(inspection.id)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/inspection/${inspection.id}`)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;


