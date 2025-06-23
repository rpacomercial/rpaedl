import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QRScanner = ({ onScan, onError, isActive = true }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const scannerRef = useRef(null);
  const qrScannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isActive && hasPermission) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive, hasPermission]);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setHasPermission(false);
      setError('Permissão de câmera negada. Por favor, permita o acesso à câmera.');
    }
  };

  const startScanner = () => {
    if (qrScannerRef.current || !scannerRef.current) return;

    try {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
          supportedScanTypes: [
            Html5QrcodeScanner.SCAN_TYPE_CAMERA,
            Html5QrcodeScanner.SCAN_TYPE_FILE
          ]
        },
        false
      );

      scanner.render(
        (decodedText, decodedResult) => {
          console.log('QR Code detectado:', decodedText);
          setIsScanning(false);
          setError(null);
          
          if (onScan) {
            onScan(decodedText, decodedResult);
          }
          
          // Redirecionar para o formulário de inspeção com o número da EDL
          navigate(`/inspect/${decodedText}`);
          
          // Parar scanner após leitura bem-sucedida
          stopScanner();
        },
        (errorMessage) => {
          // Ignorar erros de "não encontrado" que são normais
          if (!errorMessage.includes('No QR code found')) {
            console.error('Erro no scanner:', errorMessage);
          }
        }
      );

      qrScannerRef.current = scanner;
      setIsScanning(true);
      setError(null);
    } catch (err) {
      console.error('Erro ao iniciar scanner:', err);
      setError('Erro ao inicializar o scanner de QR Code');
      setIsScanning(false);
      
      if (onError) {
        onError(err);
      }
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.clear();
        qrScannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Erro ao parar scanner:', err);
      }
    }
  };

  const restartScanner = () => {
    stopScanner();
    setTimeout(() => {
      if (hasPermission) {
        startScanner();
      }
    }, 500);
  };

  const requestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      setError(null);
    } catch (err) {
      console.error('Erro ao solicitar permissão:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  };

  if (hasPermission === false) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CameraOff className="h-5 w-5" />
            Acesso à Câmera Necessário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Para escanear códigos QR, é necessário permitir o acesso à câmera do dispositivo.
          </p>
          <Button onClick={requestPermission} className="w-full">
            <Camera className="h-4 w-4 mr-2" />
            Permitir Acesso à Câmera
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scanner QR Code
          </span>
          {isScanning && (
            <Button
              variant="outline"
              size="sm"
              onClick={restartScanner}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <div className="relative">
          <div
            id="qr-reader"
            ref={scannerRef}
            className="w-full"
            style={{ minHeight: '300px' }}
          />
          
          {!isScanning && !error && hasPermission && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-md">
              <Button onClick={startScanner} className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Iniciar Scanner
              </Button>
            </div>
          )}
        </div>
        
        {isScanning && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Posicione o código QR dentro da área de leitura
            </p>
            <div className="mt-2">
              <Button
                variant="outline"
                onClick={stopScanner}
                className="flex items-center gap-2"
              >
                <CameraOff className="h-4 w-4" />
                Parar Scanner
              </Button>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 text-center">
          <p>Dica: Mantenha o código QR bem iluminado e estável</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRScanner;


