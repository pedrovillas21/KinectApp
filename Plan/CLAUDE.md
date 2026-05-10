# Plano de Implementação Back-end: API de Estatísticas (`GET /stats/summary`)

**Contexto:**
Atuo como Full-Stack e acabei de finalizar a refatoração da tela de Estatísticas ("Sua Evolução") no front-end (React Native/TypeScript). O front-end agora espera um contrato estrito via API em um formato de dados pré-processado (BFF - Backend for Frontend) para focar apenas na renderização. 

**O Contrato JSON Esperado:**
O endpoint `GET /stats/summary?period={week|month|q|year}` deve retornar exatamente a seguinte estrutura:

```json
{
  "needsWeightUpdate": boolean,
  "period": "string",
  "efficiencyPercentage": number,
  "completedSessions": number,
  "targetSessions": number,
  "weight": { 
    "history": [{"date": "YYYY-MM-DD", "weight": number}], 
    "current": number, 
    "delta": number, 
    "unit": "kg" 
  },
  "volume": { 
    "byMuscleGroup": [
      {
        "muscleGroup": "string", 
        "volume": number, 
        "deltaPercentage": number, 
        "isRest": boolean
      }
    ], 
    "total": number, 
    "deltaPercentage": number 
  },
  "community": { 
    "averagePercentage": number, 
    "isAbove": boolean 
  },
  "insight": { 
    "tag": "string", 
    "body": "string" 
  }
}
Sua Missão como Engenheiro Java/Spring Boot Sênior:

ETAPA 1: Análise de Diagnóstico (Gap Analysis)

Avalie a minha arquitetura atual de Banco de Dados, Entidades (JPA/Hibernate) e Repositórios.

Identifique se já existem métodos ou queries que calculem:

Volume de treino (Séries * Repetições * Carga) por usuário e por período.

Histórico de pesagem e variação de peso.

Contagem de treinos concluídos vs. meta do usuário.

Não recrie o que já existe. Se houver código reaproveitável, me avise e utilize-o.

ETAPA 2: Criação/Atualização da Camada de DTOs

Crie os Records ou classes DTO em Java que espelhem perfeitamente o contrato JSON exigido pelo front-end.

Garanta que a serialização do Jackson converta os nomes corretamente.

ETAPA 3: Queries e Repositórios (Otimização)

Crie as queries (JPQL ou Native SQL) faltantes para agregar os dados diretamente no banco de dados.

Crucial: O cálculo de volume (tonelagem) e agrupamento por músculo deve ser feito preferencialmente no banco para evitar carregar milhares de linhas para a memória da JVM.

ETAPA 4: Lógica de Negócio (Services)
Implemente o StatsService com as seguintes responsabilidades que faltam:

Filtro de Período: Lidar com o parâmetro ?period= e calcular as datas de início e fim (7, 30, 90 ou 365 dias) e seus respectivos períodos anteriores (para o cálculo de deltaPercentage).

Motor de Regras do Insight: Uma estrutura condicional limpa (ex: Design Pattern Strategy ou blocos if/else bem definidos) para popular insight.tag e insight.body (ex: Se aderência > 80% e peso caiu = Elogio ao déficit calórico).

Comparação de Comunidade: Uma lógica para recuperar a média global (averagePercentage). Nota: Planeje como isso pode ser cacheado ou gerado via CRON job (@Scheduled) para não penalizar a performance da chamada.

ETAPA 5: Controller

Crie ou atualize o StatsController para expor o endpoint REST, recebendo o parâmetro e retornando o DTO montado.

Regras de Saída:

Forneça o código das novas classes, interfaces e métodos detalhadamente.

Mantenha os padrões SOLID e Clean Code.

Utilize as melhores práticas do ecossistema Spring Boot atual.

Indique claramente onde eu devo colar cada trecho de código nos meus pacotes (controller, service, repository, dto).