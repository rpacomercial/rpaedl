import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { inspectionOperations } from '../services/db.js';
import apiService from '../services/api.js';

const InspectionForm = ({ edlData, onSubmit, onSave }) => {
  const [formData, setFormData] = useState({
    edlNumber: edlData?.edlNumber || '',
    localInstalacao: edlData?.localInstalacao || '', // Novo campo
    endereco: '', // Novo campo
    responsavel: edlData?.responsavel || '', // Mantido
    tipoTroca: '', // Novo campo de seleção
    nivelAgua: '', // Novo campo de seleção
    tipoOcorrencia: '', // Novo campo de seleção
    observations: '',
    status: 'in_progress',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Listeners para status de conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.edlNumber.trim()) {
      newErrors.edlNumber = 'Número da EDL é obrigatório';
    }
    if (!formData.localInstalacao.trim()) {
      newErrors.localInstalacao = 'Local de Instalação é obrigatório';
    }
    if (!formData.endereco.trim()) {
      newErrors.endereco = 'Endereço é obrigatório';
    }
    if (!formData.responsavel.trim()) {
      newErrors.responsavel = 'Nome do Responsável é obrigatório';
    }
    if (!formData.tipoTroca) {
      newErrors.tipoTroca = 'Tipo de Troca é obrigatório';
    }
    if (!formData.nivelAgua) {
      newErrors.nivelAgua = 'Nível da Água é obrigatório';
    }
    if (!formData.tipoOcorrencia) {
      newErrors.tipoOcorrencia = 'Tipo de Ocorrência é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const inspectionData = {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft'
      };

      const savedInspection = await inspectionOperations.create(inspectionData);
      
      if (onSave) {
        onSave(savedInspection);
      }

      console.log('Inspeção salva como rascunho');
    } catch (error) {
      console.error('Erro ao salvar inspeção:', error);
      setErrors({ submit: 'Erro ao salvar inspeção' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const inspectionData = {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'completed'
      };

      // Salvar localmente primeiro
      const savedInspection = await inspectionOperations.create(inspectionData);

      // Tentar enviar para API se online
      if (isOnline) {
        try {
          await apiService.submitInspection(savedInspection);
          console.log('Inspeção enviada para API');
        } catch (apiError) {
          console.log('Erro na API, dados salvos localmente para sincronização posterior');
        }
      }

      if (onSubmit) {
        onSubmit(savedInspection);
      }

      // Resetar formulário
      setFormData({
        edlNumber: '',
        localInstalacao: '',
        endereco: '',
        responsavel: '',
        tipoTroca: '',
        nivelAgua: '',
        tipoOcorrencia: '',
        observations: '',
        status: 'in_progress',
      });

    } catch (error) {
      console.error('Erro ao submeter inspeção:', error);
      setErrors({ submit: 'Erro ao submeter inspeção' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline - Dados serão sincronizados quando conectar';
    return 'Online - Dados serão enviados imediatamente';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Status de conexão */}
      <div className={`p-3 rounded-md text-white text-sm ${getStatusColor()}`}>
        <div className="flex items-center gap-2">
          {isOnline ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {getStatusText()}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações da EDL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações da EDL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edlNumber">Número da EDL *</Label>
                <Input
                  id="edlNumber"
                  value={formData.edlNumber}
                  onChange={(e) => handleInputChange('edlNumber', e.target.value)}
                  placeholder="Ex: EDL-2024-001"
                  className={errors.edlNumber ? 'border-red-500' : ''}
                />
                {errors.edlNumber && (
                  <p className="text-sm text-red-500">{errors.edlNumber}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="localInstalacao">Local de Instalação *</Label>
                <Input
                  id="localInstalacao"
                  value={formData.localInstalacao}
                  onChange={(e) => handleInputChange('localInstalacao', e.target.value)}
                  placeholder="Ex: Setor A - Sala 101"
                  className={errors.localInstalacao ? 'border-red-500' : ''}
                />
                {errors.localInstalacao && (
                  <p className="text-sm text-red-500">{errors.localInstalacao}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                placeholder="Ex: Rua das Flores, 123 - Centro"
                className={errors.endereco ? 'border-red-500' : ''}
              />
              {errors.endereco && (
                <p className="text-sm text-red-500">{errors.endereco}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsavel">Nome do Responsável *</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) => handleInputChange('responsavel', e.target.value)}
                placeholder="Nome completo do responsável pela EDL"
                className={errors.responsavel ? 'border-red-500' : ''}
              />
              {errors.responsavel && (
                <p className="text-sm text-red-500">{errors.responsavel}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Checklist de Inspeção como Seleções */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Checklist de Inspeção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipoTroca">Tipo de Troca *</Label>
              <Select value={formData.tipoTroca} onValueChange={(value) => handleInputChange('tipoTroca', value)}>
                <SelectTrigger className={errors.tipoTroca ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o Tipo de Troca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1°</SelectItem>
                  <SelectItem value="2">2°</SelectItem>
                  <SelectItem value="3">3°</SelectItem>
                  <SelectItem value="4">4°</SelectItem>
                  <SelectItem value="5">5°</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipoTroca && (
                <p className="text-sm text-red-500">{errors.tipoTroca}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivelAgua">Nível da Água *</Label>
              <Select value={formData.nivelAgua} onValueChange={(value) => handleInputChange('nivelAgua', value)}>
                <SelectTrigger className={errors.nivelAgua ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o Nível da Água" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maiorIgual50">Maior ou Igual a 50%</SelectItem>
                  <SelectItem value="menor50">Menor que 50%</SelectItem>
                  <SelectItem value="seco">Seco</SelectItem>
                </SelectContent>
              </Select>
              {errors.nivelAgua && (
                <p className="text-sm text-red-500">{errors.nivelAgua}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoOcorrencia">Tipo de Ocorrência *</Label>
              <Select value={formData.tipoOcorrencia} onValueChange={(value) => handleInputChange('tipoOcorrencia', value)}>
                <SelectTrigger className={errors.tipoOcorrencia ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o Tipo de Ocorrência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="larvas">1- Presença de Larvas</SelectItem>
                  <SelectItem value="pupas">2- Presença de Pupas</SelectItem>
                  <SelectItem value="imovelFechado">3- Imóvel Fechado</SelectItem>
                  <SelectItem value="edlDesaparecida">4- EDL Desaparecida</SelectItem>
                  <SelectItem value="edlQuebrada">5- EDL Quebrada</SelectItem>
                  <SelectItem value="edlRetirada">6- EDL Retirada do Imóvel</SelectItem>
                  <SelectItem value="semLarvas">7- Sem Larvas</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipoOcorrencia && (
                <p className="text-sm text-red-500">{errors.tipoOcorrencia}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.observations}
              onChange={(e) => handleInputChange('observations', e.target.value)}
              placeholder="Descreva observações adicionais, problemas encontrados ou recomendações..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Erros gerais */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? <Clock className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Rascunho
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Finalizar Inspeção
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InspectionForm;


