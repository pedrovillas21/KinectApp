# Plano de Implementação: Integração do Perfil Dinâmico (ProfileScreen)

Este guia orienta a implementação das alterações necessárias no front-end em **React Native / TypeScript** para consumir o novo endpoint `GET /api/users/profile` (ou `/api/user/profile`), mapeando e tratando os dados dinâmicos para exibição na seção superior da `ProfileScreen.tsx`.

---

## 1. Tipagem Estrita (TypeScript)

Para manter o padrão **Zero any**, devemos adicionar a tipagem do novo DTO que vem do back-end.

* **Arquivo:** `src/types/index.ts` (ou o arquivo central de tipos de API do projeto)

Resultado do código
Arquivo gerado com sucesso!

```typescript
export interface UserProfileResponse {
  fullName: string;
  email: string;
  memberSince: string;         // Data no formato ISO (ex: "2025-08-15")
  consecutiveDaysLogged: number; // Streak real de dias seguidos
  totalWorkoutsDone: number;     // Contagem total histórica de treinos
  targetGoal: string;            // Objetivo do aluno (ex: "Ganho de Massa")
}
2. Funções Utilitárias de Formatação (Helpers)
Criar ou isolar os métodos de tratamento de dados para evitar sobrecarga de lógica dentro do componente visual e impedir quebras de layout.

Arquivo: src/utils/formatters.ts

TypeScript
/**
 * Retorna apenas os dois primeiros nomes do aluno para evitar quebra de layout.
 */
export const formatProfileName = (fullName: string): string => {
  if (!fullName) return '';
  const names = fullName.trim().split(/\\s+/);
  return names.slice(0, 2).join(' ');
};

/**
 * Converte uma string de data ISO em formato localizado por extenso.
 * Exemplo: "2025-08-15" -> "Membro desde Ago 2025"
 */
export const formatMemberSince = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    
    // Formata o mês abreviado com a primeira letra maiúscula (ex: "ago.")
    const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    
    const year = date.getFullYear();
    
    return `Membro desde ${capitalizedMonth} ${year}`;
  } catch (error) {
    return '';
  }
};
3. Integração na Tela de Perfil (ProfileScreen.tsx)
3.1. Hook de Estado e Requisição
Adicionar a chamada para o novo endpoint utilizando o cliente HTTP configurado no projeto (Axios/Fetch) dentro de um useEffect ou via React Query.

TypeScript
const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(true);

useEffect(() => {
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      // Substituir pela rota exata definida no UserController
      const response = await api.get<UserProfileResponse>('/api/users/profile');
      setProfileData(response.data);
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchProfile();
}, []);
3.2. Mapeamento dos Componentes Visuais (UI)
Substituir as strings estáticas/mockadas do topo do card de perfil pelos seletores dinâmicos tratados:

Nome do Usuário (Título Principal):

Antes: <Text>Pedro Villas</Text>

Depois: <Text>{profileData ? formatProfileName(profileData.fullName) : 'Carregando...'}</Text>

E-mail do Usuário:

Antes: <Text>pedro.villas@email.com</Text>

Depois: <Text>{profileData?.email || ''}</Text>

Tag Cinza de Registro ("Membro desde..."):

Antes: <Text>Membro desde Out 2025</Text>

Depois: <Text>{profileData ? formatMemberSince(profileData.memberSince) : ''}</Text>

Card Amarelo (Dias Seguidos / Streak):

Injetar o valor de profileData?.consecutiveDaysLogged diretamente no componente de contador numérico em destaque.

Card Branco (Treinos Totais):

Injetar o valor de profileData?.totalWorkoutsDone para renderizar o histórico acumulado de execuções.

Texto Ciano (Objetivo do Aluno):

Substituir o rótulo fixo abaixo da seção "Ganho" ou "Foco" para renderizar dinamicamente o valor contido em profileData?.targetGoal.

4. Checklist de Execução do Front-end
[ ] [Tipos] Criar a interface estrita UserProfileResponse sem uso de any.

[ ] [Helpers] Implementar a função utilitária formatProfileName.

[ ] [Helpers] Implementar a função utilitária formatMemberSince com localização em português.

[ ] [Service/API] Verificar o caminho correto da rota (/api/users/profile) e adicionar o método de requisição.

[ ] [UI] Adicionar estados de loading/error ou skeleton simples na parte superior do perfil enquanto os dados são buscados.

[ ] [UI] Substituir todos os 6 pontos de dados mockados no topo do card pelos valores reais da API.

[ ] [Testes] Validar o comportamento do layout caso o usuário tenha um nome muito longo ou composto.