🚨 Ajustes e Definições de Regra de Negócio
Localização Exata (Tela de Perfil): Toda essa lógica de "Membro desde", "Contador de treinos restantes" e "Objetivo do aluno" será renderizada na ProfileScreen.tsx (na parte superior), e os dados devem ser agregados em um endpoint focado no perfil, como GET /api/user/profile (ou estendendo o BFF do perfil), mantendo a Home intocada.

O que é o consecutiveDaysLogged? (Definição): Para a tela de perfil, faz mais sentido comercial usar o Streak Real (Dias Consecutivos). Isso gera gamificação e o sentimento de "não posso quebrar minha sequência". A query no back-end deve calcular quantos dias seguidos, retrocedendo a partir de hoje (ou ontem, caso o usuário ainda não tenha logado hoje), possuem registros na tabela user_login_streaks.

De onde vem o targetGoal? (Mapeamento): No seu Dossiê, a entidade User já possui o campo goal (puxado do onboarding). O back-end só precisa mapear esse enum/string para o DTO.

aqui está o plano de implementação corrigido e refinado em Markdown para você colar na IDE:

Plano de Implementação: Sincronização Dinâmica do Perfil (ProfileScreen)

Este documento guia a refatoração da parte superior da tela de Perfil (`ProfileScreen.tsx`), substituindo os dados mockados por dados reais agregados do back-end. A tela Home deve permanecer intocada.

---

## 1. Banco de Dados (Flyway / PostgreSQL)

### 1.1. Auditoria de Contas (`created_at`)
Garantir que a tabela `users` possui o registro de criação da conta para alimentar a tag "Membro desde [Mês/Ano]".
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
1.2. Tabela de Presença Diária (user_login_streaks)
Criação da tabela para registrar acessos por dia civil. A restrição UNIQUE impede duplicidade no mesmo dia.

Arquivo: db/migration/V3__create_user_login_streaks_table.sql

SQL
CREATE TABLE user_login_streaks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_login_date UNIQUE (user_id, login_date)
);
2. Back-end (Java / Spring Boot)
2.1. Controle de Streak e Login Diário
Criar a entidade JPA UserLoginStreak e o repositório UserLoginStreakRepository.

Implementar uma query nativa ou lógica no Java que calcule o Streak Consecutivo Real: conta os dias seguidos em ordem decrescente a partir de hoje (ou ontem) e para assim que encontrar um "buraco" no histórico.

Gatilho de Presença: No UserController ou durante a chamada do Perfil, tentar salvar LocalDate.now(). Capturar a exceção DataIntegrityViolationException com um bloco try-catch vazio para ignorar acessos repetidos no mesmo dia.

2.2. Endpoint e DTO de Perfil Unificado
Modificar ou criar o endpoint GET /api/user/profile para encapsular a agregação de dados em um UserProfileResponseDTO:

Java
public record UserProfileResponseDTO(
    String fullName,
    String email,
    LocalDate memberSince,       // users.created_at
    int consecutiveDaysLogged,   // Streak real de dias seguidos
    int totalWorkoutsDone,       // Contagem total histórica do WorkoutExecutionLog
    String targetGoal            // users.goal vindo do onboarding (Ex: "Ganho de Massa")
) {}
Nota de Regra: A métrica centralizada no card passará a exibir o total histórico de treinos feitos (totalWorkoutsDone) para dar a sensação de progresso a longo prazo na aba Perfil.

3. Front-end (React Native / TypeScript, Zero Any)
3.1. Formatação Estatística e de Strings
Implementar uma função helper para extrair apenas o Primeiro + Segundo nome para o título principal da ProfileScreen.

TypeScript
export const formatProfileName = (fullName: string): string => {
  if (!fullName) return '';
  const names = fullName.trim().split(/\s+/);
  return names.slice(0, 2).join(' ');
};
Criar uma função para converter o memberSince (Date/String) em formato por extenso localizado: Membro desde Ago 2025.

3.2. Vinculação na ProfileScreen.tsx
Atualizar o hook de requisição para buscar os dados de GET /api/user/profile.

Mapear os campos retornados diretamente nos componentes visuais já existentes:

Substituir o nome estático por formatProfileName(data.fullName).

Substituir o e-mail sob o nome por data.email.

Substituir a tag cinza por formatMemberSince(data.memberSince).

Injetar data.consecutiveDaysLogged no número amarelo de dias seguidos.

Injetar data.totalWorkoutsDone no número branco de treinos no total.

Injetar data.targetGoal no texto ciano abaixo de Ganho.

4. Checklist para a IA
[ ] Criar arquivo de migration SQL para a tabela user_login_streaks.

[ ] Implementar a lógica de interceptação para persistir o acesso diário único.

[ ] Construir o método de cálculo de Streak Consecutivo no back-end.

[ ] Criar o UserProfileResponseDTO com a agregação de dados.

[ ] Adicionar tipagem estrita para o DTO do perfil no front-end (src/types/index.ts).

[ ] Aplicar a limpeza de strings para nomes extensos no header do perfil.

[ ] Substituir os seletores de texto mockados pelos dados dinâmicos da API.