import jsPDF from 'jspdf';
import { inspectionOperations, edlOperations } from './db.js';

// Configurações padrão do PDF
const PDF_CONFIG = {
  format: 'a4',
  orientation: 'portrait',
  unit: 'mm',
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  fontSize: {
    title: 16,
    subtitle: 14,
    normal: 10,
    small: 8
  },
  colors: {
    primary: '#4CAF50',
    secondary: '#2196F3',
    text: '#333333',
    lightGray: '#f5f5f5'
  }
};

class PDFService {
  constructor() {
    this.config = PDF_CONFIG;
  }

  // Criar novo documento PDF
  createDocument() {
    const doc = new jsPDF({
      orientation: this.config.orientation,
      unit: this.config.unit,
      format: this.config.format
    });

    // Configurar fonte padrão
    doc.setFont('helvetica');
    
    return doc;
  }

  // Adicionar cabeçalho padrão
  addHeader(doc, title, subtitle = '') {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Logo/Título principal
    doc.setFontSize(this.config.fontSize.title);
    doc.setTextColor(this.config.colors.primary);
    doc.text('RPA CODE', this.config.margins.left, 30);
    
    // Subtítulo
    doc.setFontSize(this.config.fontSize.subtitle);
    doc.setTextColor(this.config.colors.text);
    doc.text(title, this.config.margins.left, 40);
    
    if (subtitle) {
      doc.setFontSize(this.config.fontSize.normal);
      doc.text(subtitle, this.config.margins.left, 48);
    }
    
    // Data de geração
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
    doc.setFontSize(this.config.fontSize.small);
    doc.setTextColor(this.config.colors.text);
    doc.text(`Gerado em: ${dateStr}`, pageWidth - this.config.margins.right - 50, 30);
    
    // Linha separadora
    doc.setDrawColor(this.config.colors.primary);
    doc.line(this.config.margins.left, 55, pageWidth - this.config.margins.right, 55);
    
    return 65; // Retorna a posição Y após o cabeçalho
  }

  // Adicionar rodapé
  addFooter(doc, pageNumber, totalPages) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFontSize(this.config.fontSize.small);
    doc.setTextColor(this.config.colors.text);
    
    // Número da página
    const pageText = `Página ${pageNumber} de ${totalPages}`;
    const textWidth = doc.getTextWidth(pageText);
    doc.text(pageText, pageWidth - this.config.margins.right - textWidth, pageHeight - 10);
    
    // Linha separadora
    doc.setDrawColor(this.config.colors.primary);
    doc.line(this.config.margins.left, pageHeight - 20, pageWidth - this.config.margins.right, pageHeight - 20);
  }

  // Gerar relatório de inspeção individual
  async generateInspectionReport(inspectionId) {
    try {
      const inspection = await inspectionOperations.getById(inspectionId);
      if (!inspection) {
        throw new Error('Inspeção não encontrada');
      }

      const edl = await edlOperations.getByNumber(inspection.edlNumber);
      
      const doc = this.createDocument();
      let yPosition = this.addHeader(doc, 'Relatório de Inspeção', `EDL: ${inspection.edlNumber}`);
      
      // Informações da EDL
      yPosition += 10;
      doc.setFontSize(this.config.fontSize.subtitle);
      doc.setTextColor(this.config.colors.secondary);
      doc.text('Informações da EDL', this.config.margins.left, yPosition);
      
      yPosition += 8;
      doc.setFontSize(this.config.fontSize.normal);
      doc.setTextColor(this.config.colors.text);
      
      const edlInfo = [
        `Número: ${edl?.edlNumber || 'N/A'}`,
        `Local: ${edl?.location || 'N/A'}`,
        `Responsável: ${edl?.responsible || 'N/A'}`,
        `Status: ${edl?.status || 'N/A'}`
      ];
      
      edlInfo.forEach(info => {
        doc.text(info, this.config.margins.left, yPosition);
        yPosition += 6;
      });
      
      // Informações da Inspeção
      yPosition += 10;
      doc.setFontSize(this.config.fontSize.subtitle);
      doc.setTextColor(this.config.colors.secondary);
      doc.text('Detalhes da Inspeção', this.config.margins.left, yPosition);
      
      yPosition += 8;
      doc.setFontSize(this.config.fontSize.normal);
      doc.setTextColor(this.config.colors.text);
      
      const inspectionInfo = [
        `Data: ${new Date(inspection.createdAt).toLocaleDateString('pt-BR')}`,
        `Inspetor: ${inspection.inspectorName || 'N/A'}`,
        `Tipo: ${inspection.type || 'N/A'}`,
        `Status: ${inspection.status || 'N/A'}`
      ];
      
      inspectionInfo.forEach(info => {
        doc.text(info, this.config.margins.left, yPosition);
        yPosition += 6;
      });
      
      // Observações
      if (inspection.observations) {
        yPosition += 10;
        doc.setFontSize(this.config.fontSize.subtitle);
        doc.setTextColor(this.config.colors.secondary);
        doc.text('Observações', this.config.margins.left, yPosition);
        
        yPosition += 8;
        doc.setFontSize(this.config.fontSize.normal);
        doc.setTextColor(this.config.colors.text);
        
        const lines = doc.splitTextToSize(inspection.observations, 170);
        lines.forEach(line => {
          doc.text(line, this.config.margins.left, yPosition);
          yPosition += 6;
        });
      }
      
      // Itens verificados
      if (inspection.checklist && inspection.checklist.length > 0) {
        yPosition += 10;
        doc.setFontSize(this.config.fontSize.subtitle);
        doc.setTextColor(this.config.colors.secondary);
        doc.text('Itens Verificados', this.config.margins.left, yPosition);
        
        yPosition += 8;
        doc.setFontSize(this.config.fontSize.normal);
        
        inspection.checklist.forEach(item => {
          const status = item.checked ? '✓' : '✗';
          const color = item.checked ? '#4CAF50' : '#F44336';
          
          doc.setTextColor(color);
          doc.text(status, this.config.margins.left, yPosition);
          
          doc.setTextColor(this.config.colors.text);
          doc.text(item.description, this.config.margins.left + 10, yPosition);
          
          yPosition += 6;
        });
      }
      
      // Adicionar rodapé
      this.addFooter(doc, 1, 1);
      
      return doc;
    } catch (error) {
      console.error('Erro ao gerar relatório de inspeção:', error);
      throw error;
    }
  }

  // Gerar relatório consolidado
  async generateConsolidatedReport(filters = {}) {
    try {
      const inspections = await inspectionOperations.getAll();
      const edls = await edlOperations.getAll();
      
      // Filtrar dados conforme critérios
      let filteredInspections = inspections;
      
      if (filters.startDate) {
        filteredInspections = filteredInspections.filter(
          i => new Date(i.createdAt) >= new Date(filters.startDate)
        );
      }
      
      if (filters.endDate) {
        filteredInspections = filteredInspections.filter(
          i => new Date(i.createdAt) <= new Date(filters.endDate)
        );
      }
      
      if (filters.status) {
        filteredInspections = filteredInspections.filter(
          i => i.status === filters.status
        );
      }
      
      const doc = this.createDocument();
      let yPosition = this.addHeader(doc, 'Relatório Consolidado', 
        `Período: ${filters.startDate || 'Início'} a ${filters.endDate || 'Hoje'}`);
      
      // Estatísticas gerais
      yPosition += 10;
      doc.setFontSize(this.config.fontSize.subtitle);
      doc.setTextColor(this.config.colors.secondary);
      doc.text('Estatísticas Gerais', this.config.margins.left, yPosition);
      
      yPosition += 8;
      doc.setFontSize(this.config.fontSize.normal);
      doc.setTextColor(this.config.colors.text);
      
      const stats = [
        `Total de EDLs: ${edls.length}`,
        `Total de Inspeções: ${filteredInspections.length}`,
        `Inspeções Pendentes: ${filteredInspections.filter(i => i.status === 'pending').length}`,
        `Inspeções Concluídas: ${filteredInspections.filter(i => i.status === 'completed').length}`
      ];
      
      stats.forEach(stat => {
        doc.text(stat, this.config.margins.left, yPosition);
        yPosition += 6;
      });
      
      // Lista de inspeções
      yPosition += 15;
      doc.setFontSize(this.config.fontSize.subtitle);
      doc.setTextColor(this.config.colors.secondary);
      doc.text('Lista de Inspeções', this.config.margins.left, yPosition);
      
      yPosition += 8;
      doc.setFontSize(this.config.fontSize.small);
      doc.setTextColor(this.config.colors.text);
      
      // Cabeçalho da tabela
      const headers = ['EDL', 'Data', 'Inspetor', 'Status'];
      const colWidths = [30, 30, 50, 30];
      let xPosition = this.config.margins.left;
      
      doc.setFontSize(this.config.fontSize.normal);
      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      
      yPosition += 8;
      
      // Linha separadora
      doc.line(this.config.margins.left, yPosition - 2, 
               this.config.margins.left + 140, yPosition - 2);
      
      // Dados da tabela
      doc.setFontSize(this.config.fontSize.small);
      filteredInspections.forEach(inspection => {
        if (yPosition > 250) { // Nova página se necessário
          doc.addPage();
          yPosition = 30;
        }
        
        xPosition = this.config.margins.left;
        const rowData = [
          inspection.edlNumber,
          new Date(inspection.createdAt).toLocaleDateString('pt-BR'),
          inspection.inspectorName || 'N/A',
          inspection.status
        ];
        
        rowData.forEach((data, index) => {
          doc.text(String(data), xPosition, yPosition);
          xPosition += colWidths[index];
        });
        
        yPosition += 6;
      });
      
      // Adicionar rodapé
      this.addFooter(doc, 1, 1);
      
      return doc;
    } catch (error) {
      console.error('Erro ao gerar relatório consolidado:', error);
      throw error;
    }
  }

  // Salvar PDF
  async savePDF(doc, filename) {
    try {
      // Gerar blob do PDF
      const pdfBlob = doc.output('blob');
      
      // Criar URL para download
      const url = URL.createObjectURL(pdfBlob);
      
      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar PDF:', error);
      throw error;
    }
  }

  // Gerar e salvar relatório de inspeção
  async generateAndSaveInspectionReport(inspectionId) {
    const doc = await this.generateInspectionReport(inspectionId);
    const filename = `inspecao_${inspectionId}_${new Date().toISOString().split('T')[0]}.pdf`;
    await this.savePDF(doc, filename);
  }

  // Gerar e salvar relatório consolidado
  async generateAndSaveConsolidatedReport(filters = {}) {
    const doc = await this.generateConsolidatedReport(filters);
    const filename = `relatorio_consolidado_${new Date().toISOString().split('T')[0]}.pdf`;
    await this.savePDF(doc, filename);
  }
}

// Instância singleton do serviço de PDF
const pdfService = new PDFService();

export default pdfService;
export { PDFService };

