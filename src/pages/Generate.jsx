import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle,
  Save,
  QrCode
} from 'lucide-react';
import { QRGenerator } from '../components';
import { edlOperations } from '../services/db.js';

const Generate = () => {
  const navigate = useNavigate();
  const [generatedQR, setGeneratedQR] = useState(null);
  const [savedEdl, setSavedEdl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (qrData, options) => {
    console.log('QR Code gerado:', qrData, options);
    setGeneratedQR({ data: qrData, options });
    setError(null);
    setSuccess('QR Code gerado com sucesso!');

    // Se for uma EDL, tentar salvar no banco de dados
    if (options.type === 'edl') {
      try {
        const parsedData = JSON.parse(qrData);
        if (parsedData.type === 'EDL' && parsedData.edlNumber) {
          await saveEdlToDatabase(parsedData);
        }
      } catch (error) {
        console.error('Erro ao salvar EDL:', error);
      }
    }
  };

  const saveEdlToDatabase = async (edlData) => {
    setIsLoading(true);
    try {
      // Verificar se a EDL já existe
      const existingEdl = await edlOperations.getByNumber(edlData.edlNumber);
      
      if (existingEdl) {
        setError(`EDL ${edlData.edlNumber} já existe no banco de dados.`);
        return;
      }

      // Criar nova EDL
      const newEdl = {
        edlNumber: edlData.edlNumber,
        location: edlData.location || '',
        responsible: edlData.responsible || '',
        description: edlData.description || '',
        status: 'active'
      };

      const savedEdl = await edlOperations.create(newEdl);
      setSavedEdl(savedEdl);
      setSuccess(`EDL ${edlData.edlNumber} salva com sucesso no banco de dados!`);
    } catch (error) {
      console.error('Erro ao salvar EDL:', error);
      setError('Erro ao salvar EDL no banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveManually = async () => {
    if (!generatedQR) return;

    try {
      const parsedData = JSON.parse(generatedQR.data);
      if (parsedData.type === 'EDL' && parsedData.edlNumber) {
        await saveEdlToDatabase(parsedData);
      }
    } catch (error) {
      setError('Erro ao processar dados do QR Code para salvamento.');
    }
  };

  const resetGenerator = () => {
    setGeneratedQR(null);
    setSavedEdl(null);
    setError(null);
    setSuccess(null);
  };

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
              <h1 className="text-xl font-bold text-gray-900">Gerador de QR Code</h1>
              <p className="text-gray-600">Crie códigos QR para EDLs e outros dados</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Mensagens de Status */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {isLoading && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Salvando EDL no banco de dados...</p>
            </CardContent>
          </Card>
        )}

        {/* Gerador de QR Code */}
        <QRGenerator onGenerate={handleGenerate} />

        {/* Informações da EDL Salva */}
        {savedEdl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-green-500" />
                EDL Salva no Banco de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Número:</span>
                  <p className="text-gray-600">{savedEdl.edlNumber}</p>
                </div>
                {savedEdl.location && (
                  <div>
                    <span className="font-medium">Local:</span>
                    <p className="text-gray-600">{savedEdl.location}</p>
                  </div>
                )}
                {savedEdl.responsible && (
                  <div>
                    <span className="font-medium">Responsável:</span>
                    <p className="text-gray-600">{savedEdl.responsible}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">Status:</span>
                  <p className="text-gray-600">{savedEdl.status}</p>
                </div>
              </div>
              
              {savedEdl.description && (
                <div>
                  <span className="font-medium">Descrição:</span>
                  <p className="text-gray-600">{savedEdl.description}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => navigate('/scan')}
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  Testar QR Code
                </Button>
                <Button
                  variant="outline"
                  onClick={resetGenerator}
                >
                  Gerar Novo QR
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações para QR Code Gerado (mas não salvo) */}
        {generatedQR && !savedEdl && generatedQR.options.type === 'edl' && (
          <Card>
            <CardHeader>
              <CardTitle>QR Code Gerado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                O QR Code foi gerado com sucesso. Deseja salvar a EDL no banco de dados local?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveManually}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar EDL
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/scan')}
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  Testar QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Para EDLs:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Selecione "EDL (Estrutura Padrão)" como tipo de dados</li>
                <li>• Preencha o número da EDL (obrigatório)</li>
                <li>• Adicione informações como local, responsável e descrição</li>
                <li>• O QR Code será gerado automaticamente</li>
                <li>• A EDL será salva no banco de dados local</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Para dados personalizados:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Selecione "Dados Personalizados" como tipo</li>
                <li>• Digite qualquer texto ou dados que deseja codificar</li>
                <li>• Ajuste o tamanho e nível de correção conforme necessário</li>
                <li>• Faça download ou compartilhe o QR Code gerado</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Dicas:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Use tamanhos maiores para impressão</li>
                <li>• Níveis de correção mais altos são melhores para ambientes com interferência</li>
                <li>• Teste sempre o QR Code após gerar</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Generate;

