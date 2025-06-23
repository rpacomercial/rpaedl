# RPA CODE - Sistema de Controle de EDLs

Um Progressive Web App (PWA) completo para controle e inspeção de EDLs (Estruturas de Dados Locais) com funcionalidades de QR Code, formulários de inspeção, relatórios PDF e sincronização offline.

## 🚀 Características Principais

### ✅ PWA Completo
- **Funciona offline** com Service Worker
- **Instalável** em dispositivos móveis e desktop
- **Responsivo** para todas as telas
- **Compatível** com Android/iOS (versões antigas e novas)

### 📱 Funcionalidades
- **Scanner QR Code** - Leitura de códigos QR de EDLs
- **Gerador QR Code** - Criação de códigos QR para EDLs
- **Formulários de Inspeção** - Checklists completos e personalizáveis
- **Relatórios PDF** - Geração automática de relatórios
- **Sincronização Offline** - Dados salvos localmente e sincronizados quando online
- **Banco de Dados Local** - IndexedDB para armazenamento offline
- **API Integration** - Integração com APIs de saúde

### 🎨 Design Moderno
- **Material Design** com Tailwind CSS
- **Tema personalizado** com cores do sistema de saúde
- **Componentes shadcn/ui** para interface profissional
- **Ícones Lucide** para melhor experiência visual

## 📁 Estrutura do Projeto

```
rpa_code/
├── public/                  # Arquivos públicos
│   ├── icons/               # Ícones para PWA (72x72 até 512x512)
│   ├── manifest.json        # Configuração do PWA
│   ├── sw.js               # Service Worker
│   └── index.html          # Ponto de entrada
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── QRScanner.jsx    # Leitor de QR Code
│   │   ├── QRGenerator.jsx  # Gerador de QR Code
│   │   ├── InspectionForm.jsx # Formulário de inspeção
│   │   ├── ConnectionStatus.jsx # Indicador de conexão
│   │   └── index.js         # Exportações
│   ├── services/            # Lógica de negócios
│   │   ├── api.js           # Integração com APIs
│   │   ├── db.js            # Banco de dados local (IndexedDB)
│   │   └── pdf.js           # Geração de PDF
│   ├── pages/               # Telas do aplicativo
│   │   ├── Home.jsx         # Tela inicial
│   │   ├── Scan.jsx         # Leitura de QR Code
│   │   ├── Generate.jsx     # Geração de QR Code
│   │   ├── Reports.jsx      # Relatórios em PDF
│   │   ├── Settings.jsx     # Configurações de API
│   │   └── index.js         # Exportações
│   ├── App.jsx              # Componente principal
│   ├── App.css              # Estilos personalizados
│   └── main.jsx             # Inicialização
├── package.json             # Dependências e scripts
└── README.md               # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19** - Framework principal
- **Vite** - Build tool e dev server
- **React Router** - Roteamento
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes de interface
- **Lucide React** - Ícones

### PWA & Offline
- **Service Worker** - Cache e funcionalidade offline
- **IndexedDB** - Banco de dados local
- **Web App Manifest** - Configuração PWA

### QR Code
- **html5-qrcode** - Scanner de QR Code
- **react-qr-code** - Geração de QR Code
- **qrcode** - Biblioteca adicional para QR

### PDF & Relatórios
- **jsPDF** - Geração de PDF
- **pdf-lib** - Manipulação avançada de PDF

### Outras
- **idb** - Wrapper para IndexedDB
- **workbox** - Background sync

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- pnpm (recomendado) ou npm

### Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd rpa_code

# Instale as dependências
pnpm install

# Inicie o servidor de desenvolvimento
pnpm run dev

# Acesse http://localhost:5173
```

### Build para Produção
```bash
# Gere a build de produção
pnpm run build

# Sirva a build localmente para teste
pnpm run preview
```

## 📱 Funcionalidades Detalhadas

### 1. Scanner QR Code
- **Acesso à câmera** com permissões adequadas
- **Leitura automática** de códigos QR
- **Suporte a múltiplos formatos** (texto, JSON estruturado)
- **Feedback visual** com overlay e cantos de foco
- **Tratamento de erros** e fallbacks

### 2. Gerador QR Code
- **Dois modos**: EDL estruturada e dados personalizados
- **Configurações avançadas**: tamanho, nível de correção
- **Preview em tempo real** do código gerado
- **Download** em formato PNG
- **Compartilhamento** via Web Share API

### 3. Formulários de Inspeção
- **Checklist personalizável** com itens obrigatórios
- **Validação em tempo real** dos campos
- **Salvamento como rascunho** para continuar depois
- **Modo offline** com sincronização posterior
- **Barra de progresso** visual

### 4. Relatórios PDF
- **Relatórios individuais** por inspeção
- **Relatórios consolidados** com filtros
- **Design profissional** com cabeçalho e rodapé
- **Estatísticas** e gráficos
- **Download automático**

### 5. Sincronização Offline
- **Armazenamento local** com IndexedDB
- **Fila de sincronização** para dados pendentes
- **Background sync** quando conexão retorna
- **Indicadores visuais** de status de conexão
- **Retry automático** com backoff

## ⚙️ Configurações

### API
- **URL base configurável** nas configurações
- **Timeout e retry** personalizáveis
- **Autenticação** com tokens JWT
- **Teste de conexão** integrado

### Dados
- **Retenção configurável** (padrão: 30 dias)
- **Limpeza automática** de dados antigos
- **Exportação** de dados locais
- **Backup** e restauração

## 🔧 Desenvolvimento

### Estrutura de Componentes
- **Componentes reutilizáveis** bem documentados
- **Props tipadas** com PropTypes
- **Hooks customizados** para lógica compartilhada
- **Context API** para estado global

### Serviços
- **Separação de responsabilidades** clara
- **API service** com retry e error handling
- **Database service** com operações CRUD
- **PDF service** com templates customizáveis

### Estilos
- **Design system** consistente
- **Variáveis CSS** para temas
- **Responsividade** mobile-first
- **Modo escuro** automático

## 📋 Checklist de Funcionalidades

### ✅ Implementado
- [x] PWA com Service Worker
- [x] Scanner QR Code com câmera
- [x] Gerador QR Code personalizado
- [x] Formulários de inspeção completos
- [x] Banco de dados offline (IndexedDB)
- [x] Sincronização em background
- [x] Relatórios PDF
- [x] Interface responsiva
- [x] Configurações de API
- [x] Status de conexão
- [x] Ícones PWA
- [x] Manifest configurado

### 🔄 Melhorias Futuras
- [ ] Autenticação com biometria
- [ ] Notificações push
- [ ] Geolocalização para inspeções
- [ ] Fotos anexadas às inspeções
- [ ] Dashboard analytics
- [ ] Exportação para Excel
- [ ] Integração com calendário
- [ ] Modo colaborativo

## 🐛 Troubleshooting

### Problemas Comuns

**Câmera não funciona:**
- Verifique permissões do navegador
- Use HTTPS (obrigatório para câmera)
- Teste em dispositivo físico

**PWA não instala:**
- Verifique se está em HTTPS
- Confirme se manifest.json está acessível
- Teste em navegadores compatíveis

**Dados não sincronizam:**
- Verifique conexão de rede
- Confirme configurações de API
- Veja console para erros

## 📄 Licença

Este projeto foi desenvolvido para demonstração de capacidades técnicas em PWA, React e tecnologias web modernas.

## 🤝 Contribuição

Para contribuir com o projeto:
1. Fork o repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou suporte técnico, consulte a documentação ou abra uma issue no repositório.

---

**RPA CODE** - Sistema moderno e eficiente para controle de EDLs com tecnologia PWA de ponta.

