Plano de Implementação: Regeneração de Treino com IA (Full-Stack)
Visão Geral
Este fluxo permite que o usuário atualize suas informações biométricas, objetivos e histórico médico (anamnese) e force a IA (Gemini) a gerar um plano de treino completamente novo. No back-end, o plano antigo é arquivado/deletado e o novo é salvo como o plano ativo.

Camada 1: Banco de Dados (Supabase / PostgreSQL)
1.1 Atualizar Estrutura do UserProfile
Garantir que todos os campos da tela estejam mapeados e sejam editáveis.

SQL
-- Verificar se a tabela 'user_profiles' (ou similar) possui as seguintes colunas
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS target_goal VARCHAR(255), -- Ex: 'Ganho de Massa'
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5, 2), -- Ex: 78.00
ADD COLUMN IF NOT EXISTS height_cm INTEGER,       -- Ex: 175
ADD COLUMN IF NOT EXISTS age INTEGER,             -- Ex: 25
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(255), -- Ex: 'Intermediário'
ADD COLUMN IF NOT EXISTS weekly_frequency INTEGER,     -- Ex: 4
ADD COLUMN IF NOT EXISTS medical_history JSONB;    -- Anamnese detalhada (pode ser JSON)
1.2 Estratégia de Regeneração (Ciclo de Vida do Treino)
Ponto Crítico: Não devemos simplesmente dar um DELETE no treino antigo, pois isso apaga os dados históricos do usuário e quebra métricas de longo prazo (ex: "47 treinos no total").

Solução: Implementar controle de versão ou flag de status nos planos de treino.

SQL
-- Na tabela que guarda o cabeçalho do plano de treino ('workout_plans' ou similar)
ALTER TABLE workout_plans
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'; -- active, archived

-- Índice para performance de busca do plano ativo
CREATE INDEX idx_active_plan ON workout_plans (user_id, status) WHERE (status = 'active');
Lógica do Backend: Ao regenerar, o plano atual muda de 'active' para 'archived', e o novo nasce 'active'.

Camada 2: Back-end (Java / Spring Boot)
2.1 Criar DTOs de Atualização e Resposta
Java
// DTO para receber os novos dados do perfil e anamnese
public record UpdateUserProtocolRequest(
    String targetGoal,
    Double weightKg,
    Integer heightCm,
    Integer age,
    String experienceLevel,
    Integer weeklyFrequency,
    JsonNode medicalHistory // Usar JsonNode ou classe específica para Anamnese
) {}

// DTO para resposta após regeneração
public record RegenerationResponse(
    Long newPlanId,
    String message // Ex: 'Treino regenerado com sucesso!'
) {}
2.2 Endpoint e Controlador (RegenerationController)
Java
@RestController
@RequestMapping("/api/regeneration")
public class RegenerationController {

    private final RegenerationService regenerationService;

    public RegenerationController(RegenerationService regenerationService) {
        this.regenerationService = regenerationService;
    }

    @PostMapping("/workout-plan")
    public ResponseEntity<RegenerationResponse> regenerateWorkoutPlan(
        @AuthenticationPrincipal UserPrincipal userPrincipal,
        @RequestBody UpdateUserProtocolRequest request
    ) {
        // Fluxo principal de negócio
        RegenerationResponse response = regenerationService.processRegeneration(
            userPrincipal.getId(), 
            request
        );
        return ResponseEntity.ok(response);
    }
}
2.3 Camada de Serviço (RegenerationService)
Esta é a orquestração central. Use @Transactional para garantir integridade.

Java
@Service
public class RegenerationService {

    private final UserRepository userRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final GeminiService geminiService; // Serviço existente de IA

    @Transactional
    public RegenerationResponse processRegeneration(Long userId, UpdateUserProtocolRequest request) {
        // 1. Validar e Buscar Usuário/Perfil
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        // 2. Atualizar Perfil do Usuário com novos dados do DTO
        updateUserProfileFields(user, request);
        userRepository.save(user);

        // 3. Arquivar Treino Antigo (Safe approach)
        archiveActivePlan(userId);

        // 4. Invocar Motor de IA (Gemini) com novos dados
        // geminiService deve ler os dados atualizados do 'user' salvo no DB
        Long newPlanId = geminiService.generateAndSaveNewPlan(user);

        return new RegenerationResponse(newPlanId, "Plano de treino regenerado com sucesso baseado nos novos dados.");
    }

    private void archiveActivePlan(Long userId) {
        // Busca plano onde user_id = X e status = 'active'
        // Muda status para 'archived' e salva
    }
}
Camada 3: Front-end (React Native / TypeScript, Zero Any)
3.1 Tipagem (types/index.ts)
TypeScript
export interface ProtocolUpdateData {
  targetGoal: string;
  weightKg: number;
  heightCm: number;
  age: number;
  experienceLevel: string;
  weeklyFrequency: number;
  // Estrutura de Anamnese pode ser expandida conforme o Dossiê Médico
  medicalHistoryAnswers: Array<{ questionId: string; answer: string; hasCondition: boolean }>; 
}

export interface RegenerationResponse {
  newPlanId: number;
  message: string;
}
3.2 Lógica de Estado e Edição (ProfileProtocolScreen.tsx)
Usar o valor retornado do BFF (useAuth ou hook de Perfil) como valor inicial (initialValue) de campos controlados ou formulário (usando React Hook Form ou similar).

Tornar as linhas da lista clicáveis para abrir modais de edição.

TypeScript
// Exemplo de estado controlado para a lista (pode ser hook form também)
const [protocolForm, setProtocolForm] = useState<ProtocolUpdateData>({
  targetGoal: initialGoal || '', // Valor vindo do BFF de perfil
  weightKg: initialWeight || 0,
  // ...outros campos
});

// Modais de Edição (ex: para o Peso)
const [isWeightModalVisible, setIsWeightModalVisible] = useState<boolean>(false);
3.3 Interação da Anamnese
O campo Anamnese (10 de 12 respondidas) é clicável.

Ação: Deve navegar para a tela de Anamnese Clínica/Dossiê Médico (MedicalHistoryScreen ou similar), passando os dados atuais para pré-visualização.

O usuário edita, salva e volta para a tela de Protocolo. O backend de anamnese deve salvar as respostas parciais.

3.4 Disparar Regeneração (src/api.ts)
Implementar a chamada ao novo endpoint.

TypeScript
// No componente, ao clicar em "Regenerar treino com IA"
const handleRegenerateWorkout = async () => {
  try {
    // 1. Mostrar loading na tela
    setIsLoading(true);

    // 2. Coletar estado atual do formulário (que inclui anamnese salva no DB)
    const payload: ProtocolUpdateData = { ...protocolForm };

    // 3. Chamar API
    const response = await api.post<RegenerationResponse>('/api/regeneration/workout-plan', payload);

    // 4. feedback de sucesso e navegar para Home/ActiveSession
    showSuccessToast(response.data.message);
    navigation.navigate('Home', { refresh: true }); 
  } catch (error) {
    handleApiError(error);
  } finally {
    setIsLoading(false);
  }
};
3.5 Polimento Visuais (Fronte-end)
Selo Anamnese (Pendente): Usar status da anamnese do backend para renderizar dinamicamente ("PENDENTE", "CONCLUÍDO", "ATUALIZAR") e as cores (âmbar/verde).

Checklist de Execução para a IA na IDE
[ ] [DB] Migration SQL para arquivamento seguro e colunas biométricas.

[ ] [BE] Criar DTOs de Update e Regeneration.

[ ] [BE] Implementar RegenerationController protegido por JWT.

[ ] [BE] Implementar RegenerationService (lógica de arquivamento + salvar perfil + chamar Gemini).

[ ] [BE] Validar se o motor do Gemini está consumindo os dados atuais do perfil salvo no DB.

[ ] [FE] Adicionar tipagem estrita para Update e Response.

[ ] [FE] Criar estados controlados para os campos de protocolo editáveis.

[ ] [FE] Implementar navegação reativa para a tela de Anamnese.

[ ] [FE] Vincular o botão de regeneração ao novo endpoint do back-end.