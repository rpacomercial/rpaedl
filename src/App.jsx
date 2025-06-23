import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Home, Scan, Generate, Reports, Settings } from './pages';
import { InspectionForm } from './components';
import initDB, { edlOperations, settingsOperations } from './services/db.js';
import './App.css';

function App() {
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Inicializar banco de dados
      await initDB();
      setIsDbInitialized(true);
      
      // Registrar Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registrado:', registration);
        } catch (error) {
          console.error('Erro ao registrar Service Worker:', error);
        }
      }

      // Configurar listeners para instalação do PWA
      setupPWAInstallPrompt();
      
    } catch (error) {
      console.error('Erro ao inicializar aplicativo:', error);
      setDbError(error.message);
    }
  };

  const setupPWAInstallPrompt = () => {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevenir o prompt automático
      e.preventDefault();
      deferredPrompt = e;
      
      // Mostrar botão de instalação personalizado se necessário
      console.log('PWA pode ser instalado');
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA foi instalado');
      deferredPrompt = null;
    });
  };

  // Tela de loading enquanto inicializa
  if (!isDbInitialized && !dbError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">RPA CODE</h2>
          <p className="text-gray-600">Inicializando aplicativo...</p>
        </div>
      </div>
    );
  }

  // Tela de erro se falhou na inicialização
  if (dbError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro na Inicialização</h2>
          <p className="text-gray-600 mb-4">{dbError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Página inicial */}
          <Route path="/" element={<Home />} />
          
          {/* Scanner de QR Code */}
          <Route path="/scan" element={<Scan />} />
          
          {/* Gerador de QR Code */}
          <Route path="/generate" element={<Generate />} />
          
          {/* Formulário de inspeção manual */}
          <Route path="/inspection" element={<InspectionFormPage />} />
          
          {/* Formulário de inspeção via QR Code */}
          <Route path="/inspect/:edlNumber" element={<InspectionFormPageFromQR />} />
          
          {/* Visualizar inspeção específica */}
          <Route path="/inspection/:id" element={<InspectionViewPage />} />
          
          {/* Relatórios */}
          <Route path="/reports" element={<Reports />} />
          
          {/* Configurações */}
          <Route path="/settings" element={<Settings />} />
          
          {/* Redirecionar rotas não encontradas para home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

// Componente para formulário de inspeção manual
const InspectionFormPage = () => {
  const navigate = useNavigate();
  
  const handleSubmit = (inspection) => {
    console.log('Inspeção submetida:', inspection);
    navigate('/', { 
      state: { 
        message: 'Inspeção realizada com sucesso!',
        type: 'success'
      }
    });
  };

  const handleSave = (inspection) => {
    console.log('Inspeção salva como rascunho:', inspection);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Nova Inspeção</h1>
              <p className="text-gray-600">Criar inspeção manual</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <InspectionForm
          onSubmit={handleSubmit}
          onSave={handleSave}
        />
      </main>
    </div>
  );
};

// Novo componente para formulário de inspeção a partir do QR Code
const InspectionFormPageFromQR = () => {
  const navigate = useNavigate();
  const { edlNumber } = useParams();
  const [edlData, setEdlData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEdlData = async () => {
      if (edlNumber) {
        try {
          const existingEdl = await edlOperations.getByNumber(edlNumber);
          if (existingEdl) {
            setEdlData(existingEdl);
          } else {
            // Se a EDL não existe, cria uma nova com o número escaneado
            setEdlData({ edlNumber: edlNumber });
          }
        } catch (error) {
          console.error('Erro ao carregar dados da EDL:', error);
          setEdlData({ edlNumber: edlNumber }); // Continua com o número mesmo em caso de erro
        }
      }
      setIsLoading(false);
    };
    loadEdlData();
  }, [edlNumber]);

  const handleSubmit = (inspection) => {
    console.log('Inspeção submetida:', inspection);
    navigate('/', { 
      state: { 
        message: 'Inspeção realizada com sucesso!',
        type: 'success'
      }
    });
  };

  const handleSave = (inspection) => {
    console.log('Inspeção salva como rascunho:', inspection);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Nova Inspeção (EDL: {edlNumber})</h1>
              <p className="text-gray-600">Preencha os detalhes da inspeção</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <InspectionForm
          edlData={edlData}
          onSubmit={handleSubmit}
          onSave={handleSave}
        />
      </main>
    </div>
  );
};

// Componente para visualizar inspeção específica
const InspectionViewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInspection();
  }, [id]);

  const loadInspection = async () => {
    try {
      // Implementar busca da inspeção por ID
      // const inspectionData = await inspectionOperations.getById(id);
      // setInspection(inspectionData);
      console.log('Carregando inspeção:', id);
    } catch (error) {
      console.error('Erro ao carregar inspeção:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Visualizar Inspeção</h1>
              <p className="text-gray-600">ID: {id}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Detalhes da inspeção serão exibidos aqui.</p>
          {/* Implementar visualização detalhada da inspeção */}
        </div>
      </main>
    </div>
  );
};

export default App;


