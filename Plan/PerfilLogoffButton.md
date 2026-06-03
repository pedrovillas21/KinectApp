Plano de Implementação: Fluxo de Logoff com Bottom Sheet (ProfileScreen)

Este guia orienta a implementação do fluxo completo de desconexão (Sair da Conta) do Kinetic App. O comportamento envolve abrir um Bottom Sheet customizado (conforme `image_f4d0b5.png`) ao clicar em "Sair da conta" na `ProfileScreen.tsx`, limpar o estado global de autenticação e revogar os tokens de acesso de forma segura.

---

## 1. Front-end: Camada de Contexto (`AuthContext.tsx`)

Antes de construir a interface, precisamos garantir que o contexto de autenticação exponha a função que limpa a sessão local.
* **Tarefa:** Verificar se a função `signOut` (ou equivalente) já está implementada e tipada no `AuthContext.tsx`.
* **Regras da Função:**
    1. Remover o Token JWT do armazenamento seguro do dispositivo (Ex: `SecureStore` do Expo ou `AsyncStorage`).
    2. Resetar o estado do usuário (`setUser(null)`).
    3. Garantir que os interceptors do `api.ts` sejam limpos para requisições futuras.

---

## 2. Front-end: UI do Modal (ProfileScreen.tsx)

Adicionar o componente visual de confirmação na tela de perfil. Recomenda-se o uso de `@gorhom/bottom-sheet` ou um `Modal` nativo do React Native estilizado de forma customizada para seguir fielmente o design.

### 2.1. Tokens de Estilização e Specs Visuais (Image Reference)
* **Fundo do Painel:** Cinza escuro/Superfície (`#1C1C1E` ou token equivalente do `kinetic.ts`).
* **Indicador Superior:** Barra de arrasto centralizada e discreta no topo do sheet.
* **Ícone Central:** Ícone de Logout (`log-out` do Lucide/Ionicons) encapsulado em um container quadrado com cantos arredondados e fundo vermelho escuro opaco/suave.
* **Tipografia:**
    * Título: `"Sair da conta?"` em Bold, Branco, tamanho destacado.
    * Subtítulo: `"Você precisará fazer login novamente para acessar seus treinos e ranking."` em tom cinza claro, centralizado.
* **Botões de Ação (Flex Row):**
    * **Cancelar (Esquerda):** Fundo cinza opaco, texto em Branco. Ação: Fecha o modal/bottom sheet.
    * **Sair (Direita):** Fundo Coral/Vermelho Vivo (`#FF5A66` ou similar), texto em Preto/Negrito. Ação: Dispara o método `signOut` do contexto.

---

## 3. Lógica de Integração e Fluxo

No arquivo `src/screens/ProfileScreen.tsx`:

### 3.1. Controle de Estado do Modal
```typescript
const bottomSheetRef = useRef<BottomSheet>(null); // Se usar Gorhom
// OU
const [isLogoutModalVisible, setIsLogoutModalVisible] = useState<boolean>(false);
3.2. Vinculação do Gatilho
Localizar o botão/linha "Sair da conta" existente no fim da AccountSection ou lista de suporte.

Mudar o onPress para disparar a abertura do sheet: setIsLogoutModalVisible(true).

3.3. Execução do Logoff
Ao pressionar o botão vermelho "Sair" dentro do modal:

TypeScript
const handleConfirmSignOut = async () => {
  try {
    // 1. Fecha o modal preventivamente
    setIsLogoutModalVisible(false);
    
    // 2. Executa a limpeza global de tokens e estados
    await signOut(); 
    
    // Nota: O AppRoutes.tsx deve identificar automaticamente que o 'user' é null 
    // e redirecionar o usuário para a AuthStack (LoginScreen) sem necessidade de navegação manual.
  } catch (error) {
    console.error("Erro ao deslogar:", error);
  }
};
4. Checklist de Execução para a IA
[ ] Confirmar que o AuthContext expõe uma função signOut estritamente tipada e funcional.

[ ] Criar a estrutura do Bottom Sheet / Modal customizado na base do arquivo ProfileScreen.tsx.

[ ] Aplicar o design identitário: ícone vermelho suave, botão cancelar (cinza) e botão sair (coral).

[ ] Atrelar o clique do botão de logout da lista à abertura desse novo painel.

[ ] Conectar o botão coral ao método de limpeza e validar o redirecionamento reativo do app para a tela de login.