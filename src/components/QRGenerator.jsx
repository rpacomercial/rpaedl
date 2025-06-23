import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Copy, Share2, QrCode } from 'lucide-react';

const QRGenerator = ({ initialData = '', onGenerate }) => {
  const [qrData, setQrData] = useState(initialData);
  const [qrSize, setQrSize] = useState(256);
  const [qrLevel, setQrLevel] = useState('M');
  const [edlNumber, setEdlNumber] = useState('');
  const [location, setLocation] = useState('');
  const [responsible, setResponsible] = useState('');
  const [description, setDescription] = useState('');
  const [dataType, setDataType] = useState('custom');
  const qrRef = useRef(null);

  useEffect(() => {
    if (dataType === 'edl') {
      generateEdlData();
    }
  }, [edlNumber, location, responsible, description, dataType]);

  const generateEdlData = () => {
    if (dataType === 'edl' && edlNumber) {
      const edlData = {
        type: 'EDL',
        edlNumber,
        location,
        responsible,
        description,
        createdAt: new Date().toISOString()
      };
      setQrData(JSON.stringify(edlData));
    }
  };

  const handleDataTypeChange = (type) => {
    setDataType(type);
    if (type === 'custom') {
      setQrData(initialData);
    } else if (type === 'edl') {
      generateEdlData();
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    // Converter SVG para Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = qrSize;
      canvas.height = qrSize;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, qrSize, qrSize);
      ctx.drawImage(img, 0, 0);
      
      // Download
      const link = document.createElement('a');
      link.download = `qr-code-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(data);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      // Aqui você pode adicionar uma notificação de sucesso
      console.log('Dados copiados para a área de transferência');
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Código QR - RPA CODE',
          text: qrData,
          url: window.location.href
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback para navegadores que não suportam Web Share API
      copyToClipboard();
    }
  };

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate(qrData, {
        size: qrSize,
        level: qrLevel,
        type: dataType
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Gerador de QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tipo de dados */}
          <div className="space-y-2">
            <Label htmlFor="dataType">Tipo de Dados</Label>
            <Select value={dataType} onValueChange={handleDataTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Dados Personalizados</SelectItem>
                <SelectItem value="edl">EDL (Estrutura Padrão)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Formulário para EDL */}
          {dataType === 'edl' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edlNumber">Número da EDL *</Label>
                  <Input
                    id="edlNumber"
                    value={edlNumber}
                    onChange={(e) => setEdlNumber(e.target.value)}
                    placeholder="Ex: EDL-2024-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Setor A - Sala 101"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsible">Responsável</Label>
                <Input
                  id="responsible"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  placeholder="Nome do responsável"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição adicional da EDL"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Dados personalizados */}
          {dataType === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="qrData">Dados para o QR Code</Label>
              <Textarea
                id="qrData"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                placeholder="Digite os dados que serão codificados no QR Code"
                rows={4}
              />
            </div>
          )}

          {/* Configurações do QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qrSize">Tamanho (px)</Label>
              <Select value={qrSize.toString()} onValueChange={(value) => setQrSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="128">128px</SelectItem>
                  <SelectItem value="256">256px</SelectItem>
                  <SelectItem value="512">512px</SelectItem>
                  <SelectItem value="1024">1024px</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qrLevel">Nível de Correção</Label>
              <Select value={qrLevel} onValueChange={setQrLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Baixo (7%)</SelectItem>
                  <SelectItem value="M">Médio (15%)</SelectItem>
                  <SelectItem value="Q">Alto (25%)</SelectItem>
                  <SelectItem value="H">Muito Alto (30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualização do QR Code */}
      {qrData && (
        <Card>
          <CardHeader>
            <CardTitle>QR Code Gerado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center p-4 bg-white rounded-md border">
              <div ref={qrRef}>
                <QRCode
                  value={qrData}
                  size={Math.min(qrSize, 300)}
                  level={qrLevel}
                  includeMargin={true}
                />
              </div>
            </div>
            
            {/* Ações */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={downloadQR} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button onClick={copyToClipboard} variant="outline" className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copiar Dados
              </Button>
              <Button onClick={shareQR} variant="outline" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
              {onGenerate && (
                <Button onClick={handleGenerate} className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Usar QR Code
                </Button>
              )}
            </div>
            
            {/* Dados codificados */}
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <Label className="text-sm font-medium">Dados Codificados:</Label>
              <pre className="text-xs mt-1 whitespace-pre-wrap break-all">
                {qrData}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QRGenerator;

