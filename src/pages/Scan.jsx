import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  MapPin,
  User,
  Calendar
} from 'lucide-react';
import { QRScanner, InspectionForm } from '../components';
import { edlOperations } from '../services/db.js';

const Scan = () => {
  const navigate = useNavigate();
  const [scannedData, setScannedData] = useState(null);
  const [edlData, setEdlData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInspectionForm, setShowInspectionForm] = useState(false);

  const handleScan = async (decodedText, decodedResult) => {
    console.log('QR Code escaneado:', decodedText);
    setIsLoading(true);
    setError(null);

    try {
      // Tentar parsear como JSON primeiro (para EDLs estruturadas)
      let parsedData;
      try {
        parsedData = JSON.parse(decodedText);
      } catch {
        // Se não for JSON, tratar como texto simples
        parsedData = { edlNumber: decodedText };
      }

      setScannedData(parsedData);

      // Buscar dados da EDL no banco local
      let edl = null;
      if (parsedData.edlNumber) {
        edl = await edlOperations.getByNumber(parsedData.edlNumber);
      }

      if (edl) {
        setEdlData(edl);
      } else if (parsedData.type === 'EDL') {
        // Se o QR Code contém dados da EDL, usar esses dados
        setEdlData(parsedData);
      } else {
        // EDL não encontrada, perguntar se quer cadastrar
        setError('EDL não encontrada no banco de dados local.');
      }
    } catch (error) {
      console.error('Erro ao processar QR Code:', error);
      setError('Erro ao processar o código QR. Verifique se o código está correto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanError = (error) => {
    console.error('Erro no scanner:', error);
    setError('Erro ao acessar a câmera. Verifique as permissões.');
  };

  const handleCreateNewEdl = async () => {
    try {
      if (scannedData && scannedData.edlNumber) {
        const newEdl = {
          edlNumber: scannedData.edlNumber,
          location: scannedData.location || '',
          responsible: scannedData.responsible || '',
          description: scannedData.description || '',
          status: 'active'
        };

        const createdEdl = await edlOperations.create(newEdl);
        setEdlData(createdEdl);
        setError(null);
      }
    } catch (error) {
      console.error('Erro ao criar EDL:', error);
      setError('Erro ao criar nova EDL.');
    }
  };

  const handleStartInspection = () => {
    setShowInspectionForm(true);
  };

  const handleInspectionSubmit = (inspection) => {
    console.log('Inspeção submetida:', inspection);
    // Redirecionar para página de sucesso ou home
    navigate('/', { 
      state: { 
        message: 'Inspeção realizada com sucesso!',
        type: 'success'
      }
    });
  };

  const handleInspectionSave = (inspection) => {
    console.log('Inspeção salva como rascunho:', inspection);
  };

  const resetScan = () => {
    setScannedData(null);
    setEdlData(null);
    setError(null);
    setShowInspectionForm(false);
  };

  if (showInspectionForm && edlData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInspectionForm(false)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Nova Inspeção</h1>
                <p className="text-gray-600">EDL: {edlData.edlNumber}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4">
          <InspectionForm
            edlData={edlData}
            onSubmit={handleInspectionSubmit}
            onSave={handleInspectionSave}
          />
        </main>
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
              <h1 className="text-xl font-bold text-gray-900">Scanner QR Code</h1>
              <p className="text-gray-600">Escaneie o código QR de uma EDL</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Scanner */}
        {!scannedData && (
          <QRScanner
            onScan={handleScan}
            onError={handleScanError}
            isActive={true}
          />
        )}

        {/* Loading */}
        {isLoading && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Processando código QR...</p>
            </CardContent>
          </Card>
        )}

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              {scannedData && scannedData.edlNumber && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateNewEdl}
                  className="ml-4"
                >
                  Cadastrar EDL
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Dados Escaneados */}
        {scannedData && !edlData && !error && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados Escaneados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(scannedData, null, 2)}
              </pre>
              <div className="mt-4 flex gap-2">
                <Button onClick={resetScan} variant="outline">
                  Escanear Novamente
                </Button>
                {scannedData.edlNumber && (
                  <Button onClick={handleCreateNewEdl}>
                    Cadastrar como Nova EDL
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* EDL Encontrada */}
        {edlData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                EDL Encontrada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Número:</span>
                    <span>{edlData.edlNumber}</span>
                  </div>
                  
                  {edlData.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Local:</span>
                      <span>{edlData.location}</span>
                    </div>
                  )}
                  
                  {edlData.responsible && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Responsável:</span>
                      <span>{edlData.responsible}</span>
                    </div>
                  )}
                  
                  {edlData.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Criado em:</span>
                      <span>{new Date(edlData.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
                
                {edlData.description && (
                  <div>
                    <span className="font-medium">Descrição:</span>
                    <p className="text-gray-600 mt-1">{edlData.description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleStartInspection}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Iniciar Inspeção
                </Button>
                <Button
                  variant="outline"
                  onClick={resetScan}
                >
                  Escanear Outro QR
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        {!scannedData && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Como usar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">
                1. Posicione a câmera sobre o código QR da EDL
              </p>
              <p className="text-sm text-gray-600">
                2. Aguarde a leitura automática do código
              </p>
              <p className="text-sm text-gray-600">
                3. Verifique os dados da EDL encontrada
              </p>
              <p className="text-sm text-gray-600">
                4. Inicie uma nova inspeção ou escaneie outro código
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Scan;

