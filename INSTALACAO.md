# 🚀 INSTRUÇÕES DE INSTALAÇÃO E USO - RPA CODE

## 📋 Resumo do Projeto

O **RPA CODE** é um Progressive Web App (PWA) completo para controle de EDLs com:
- ✅ Scanner e gerador de QR Code
- ✅ Formulários de inspeção offline
- ✅ Relatórios PDF automáticos
- ✅ Sincronização em background
- ✅ Interface moderna e responsiva
- ✅ Compatível com Android/iOS

## 🛠️ Como Executar Localmente

### 1. Pré-requisitos
```bash
# Verificar se Node.js está instalado (versão 18+)
node --version

# Verificar se pnpm está instalado
pnpm --version
```

### 2. Executar o Projeto
```bash
# Navegar para o diretório
cd rpa_code

# Instalar dependências (se necessário)
pnpm install

# Iniciar servidor de desenvolvimento
pnpm run dev --host

# Acessar no navegador: http://localhost:5173
```

### 3. Build para Produção
```bash
# Gerar build otimizada
pnpm run build

# Testar build localmente
pnpm run preview
```

## 📱 Como Usar o Aplicativo

### Tela Inicial (Dashboard)
- **Estatísticas** em tempo real
- **Ações rápidas** para principais funcionalidades
- **Status de conexão** e sincronização
- **Inspeções recentes**

### Scanner QR Code
1. Clique em "Escanear QR Code"
2. Permita acesso à câmera
3. Posicione o código QR na área de leitura
4. Aguarde leitura automática
5. Visualize dados da EDL encontrada
6. Inicie nova inspeção se necessário

### Gerador QR Code
1. Clique em "Gerar QR Code"
2. Escolha o tipo:
   - **EDL**: Preencha dados estruturados
   - **Personalizado**: Digite qualquer texto
3. Configure tamanho e correção
4. Visualize o código gerado
5. Faça download ou compartilhe

### Formulário de Inspeção
1. Preencha dados do inspetor
2. Complete informações da EDL
3. Marque itens do checklist
4. Adicione observações
5. Salve como rascunho ou finalize
6. Dados são sincronizados automaticamente

### Relatórios
1. Acesse "Relatórios"
2. Use filtros para refinar dados
3. Visualize estatísticas
4. Gere PDF consolidado
5. Baixe relatórios individuais

### Configurações
1. Configure URL da API
2. Ajuste timeout e tentativas
3. Teste conexão
4. Configure sincronização
5. Gerencie dados locais

## 🔧 Funcionalidades Técnicas

### PWA (Progressive Web App)
- **Instalável**: Adicione à tela inicial
- **Offline**: Funciona sem internet
- **Responsivo**: Adapta-se a qualquer tela
- **Rápido**: Cache inteligente

### Banco de Dados Local
- **IndexedDB**: Armazenamento robusto
- **Sincronização**: Dados enviados quando online
- **Backup**: Exportação de dados
- **Limpeza**: Remoção automática de dados antigos

### QR Code
- **Scanner**: Usa câmera do dispositivo
- **Gerador**: Múltiplos formatos e tamanhos
- **Compatibilidade**: Funciona em todos os navegadores
- **Offline**: Não precisa de internet

## 📊 Estrutura de Dados

### EDL (Estrutura de Dados Local)
```json
{
  "edlNumber": "EDL-2024-001",
  "location": "Setor A - Sala 101",
  "responsible": "João Silva",
  "description": "Descrição da EDL",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Inspeção
```json
{
  "id": 1,
  "edlNumber": "EDL-2024-001",
  "inspectorName": "Maria Santos",
  "inspectorId": "12345",
  "inspectionType": "routine",
  "status": "completed",
  "checklist": [
    {
      "id": "structure",
      "description": "Estrutura física em boas condições",
      "checked": true,
      "required": true
    }
  ],
  "observations": "Tudo em ordem",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## 🌐 Instalação como PWA

### Android
1. Abra no Chrome
2. Toque no menu (⋮)
3. Selecione "Adicionar à tela inicial"
4. Confirme instalação

### iOS
1. Abra no Safari
2. Toque no botão compartilhar
3. Selecione "Adicionar à Tela de Início"
4. Confirme instalação

### Desktop
1. Abra no Chrome/Edge
2. Clique no ícone de instalação na barra de endereços
3. Confirme instalação

## 🔒 Segurança e Privacidade

### Dados Locais
- Armazenados apenas no dispositivo
- Criptografia automática do navegador
- Limpeza automática configurável

### Câmera
- Acesso apenas quando necessário
- Sem armazenamento de imagens
- Permissões respeitadas

### API
- Comunicação HTTPS obrigatória
- Tokens de autenticação
- Retry com backoff

## 🐛 Solução de Problemas

### Câmera não funciona
```
Soluções:
1. Verificar permissões do navegador
2. Usar HTTPS (obrigatório)
3. Testar em dispositivo físico
4. Reiniciar navegador
```

### PWA não instala
```
Soluções:
1. Usar HTTPS
2. Verificar manifest.json
3. Testar em navegador compatível
4. Limpar cache
```

### Dados não sincronizam
```
Soluções:
1. Verificar conexão de rede
2. Confirmar configurações de API
3. Verificar console para erros
4. Tentar sincronização manual
```

### Performance lenta
```
Soluções:
1. Limpar dados antigos
2. Executar manutenção
3. Reiniciar aplicativo
4. Verificar espaço em disco
```

## 📈 Monitoramento

### Métricas Importantes
- **Inspeções por dia**
- **Taxa de sincronização**
- **Tempo offline**
- **Erros de API**

### Logs
- Console do navegador
- Service Worker logs
- IndexedDB status
- Network requests

## 🔄 Atualizações

### Automáticas
- Service Worker atualiza automaticamente
- Cache renovado em background
- Notificação de nova versão

### Manuais
- Recarregar página força atualização
- Limpar cache do navegador
- Reinstalar PWA

## 📞 Suporte

### Recursos Disponíveis
- **README.md**: Documentação completa
- **Console**: Logs detalhados
- **Configurações**: Teste de conectividade
- **Exportação**: Backup de dados

### Informações do Sistema
- Versão do navegador
- Suporte a PWA
- Capacidade de armazenamento
- Status de conectividade

---

**🎉 Parabéns! Seu aplicativo RPA CODE está pronto para uso!**

O sistema oferece uma solução completa e moderna para controle de EDLs com tecnologia PWA de ponta, funcionando perfeitamente offline e online.

