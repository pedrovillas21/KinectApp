package com.kinetic.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinetic.dtos.GeminiRequestDto;
import com.kinetic.dtos.GeminiResponseDto;
import com.kinetic.dtos.GeneratedWorkoutPlanDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.http.client.JdkClientHttpRequestFactory;

import java.time.Duration;
import java.util.List;
import com.fasterxml.jackson.core.type.TypeReference;

@Service
public class GeminiService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    public GeminiService(ObjectMapper objectMapper) {
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory();
        requestFactory.setReadTimeout(Duration.ofSeconds(30));
        
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
        this.objectMapper = objectMapper;
    }

    public List<GeneratedWorkoutPlanDto> generateWorkoutPlan(String level, int age, double weight, double height, String goal, int frequency) {
        // Validação defensiva dos parâmetros
        if (level == null || level.isBlank()) throw new IllegalArgumentException("Nível não pode ser vazio.");
        if (goal == null || goal.isBlank()) throw new IllegalArgumentException("Objetivo não pode ser vazio.");
        if (age < 10 || age > 120) throw new IllegalArgumentException("Idade fora do intervalo permitido (10–120): " + age);
        if (weight <= 0 || weight > 500) throw new IllegalArgumentException("Peso inválido: " + weight);
        if (height <= 0 || height > 300) throw new IllegalArgumentException("Altura inválida (cm): " + height);
        if (frequency < 1 || frequency > 7) throw new IllegalArgumentException("Frequência deve ser entre 1 e 7: " + frequency);

        String prompt = buildPrompt(level, age, weight, height, goal, frequency);

        GeminiRequestDto requestDto = new GeminiRequestDto(
                List.of(GeminiRequestDto.Content.of(prompt)),
                GeminiRequestDto.GenerationConfig.json());

        GeminiResponseDto response = restClient.post()
                .uri(apiUrl + "?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestDto)
                .retrieve()
                .body(GeminiResponseDto.class);

        if (response == null || response.getText() == null) {
            throw new RuntimeException("Failed to get response from Gemini API");
        }

        String jsonText = response.getText();

        try {
            return objectMapper.readValue(jsonText, new TypeReference<List<GeneratedWorkoutPlanDto>>() {});
        } catch (JsonProcessingException e) {
            throw new InvalidGeminiResponseException("A IA retornou um treino em formato invalido. Tente gerar novamente.", e);
        }
    }

    public static class InvalidGeminiResponseException extends RuntimeException {
        public InvalidGeminiResponseException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    private String buildPrompt(String level, int age, double weight, double height, String goal, int frequency) {
        String focus = switch (level.toUpperCase()) {
            case "INICIANTE" -> "Iniciante na musculação com pouca ou nenhuma experiência. Foco em construção muscular e resistência.";
            case "INTERMEDIARIO" -> "Pessoa já mais adptado a rotina buscando melhora física, já possui mais experiência nas execuções. Foco em hipertrofia e força.";
            case "PRO" -> "Veterano de academia, tem pleno domínio das técnicas e estratégias de treinamento. Foco em performance, definição e otimização de resultados.";
            default -> "Foco em Condicionamento Geral.";
        };

        String goalContext = switch (goal.toUpperCase()) {
            case "GANHO DE MASSA" -> "O objetivo principal é HIPERTROFIA e ganho de massa muscular. Priorize exercícios compostos pesados e volume adequado. Cardio moderado de zona 2-3 para controle de gordura, evitando excessos que possam comprometer a recuperação muscular.";
            case "PERDA DE GORDURA" -> "O objetivo principal é PERDA DE GORDURA. Inclua circuitos metabólicos, supersets e sugira cardio HIIT pós-treino. Adeque o hiit de acordo com o peso: %.1f kg e idade: %d anos informados, evitando exercícios de alto impacto para alunos mais pesados ou mais velhos.";
            case "PERFORMANCE" -> "O objetivo principal é PERFORMANCE ATLÉTICA. Foque em exercícios funcionais, explosivos e de potência. Lembre-se de sugerir um cardio de zona 2-3 para recuperação ativa e também alguns cardios de longa duração em corrida, divida bem entre os dias de treino para permitir recuperação adequada.";
            default -> "Objetivo geral de condicionamento físico.";
        };

        String metabolismContext;
        if (age <= 22) {
            metabolismContext = "Aluno jovem (%d anos) com metabolismo acelerado e alta capacidade de recuperação. Pode suportar maior volume e intensidade.".formatted(age);
        } else if (age <= 30) {
            metabolismContext = "Aluno adulto jovem (%d anos) com boa capacidade de recuperação. Volume moderado-alto é ideal.".formatted(age);
        } else if (age <= 40) {
            metabolismContext = "Aluno adulto (%d anos). Considerar tempo de recuperação entre sessões e priorizar aquecimento articular.".formatted(age);
        } else {
            metabolismContext = "Aluno maduro (%d anos). Reduzir impacto articular, priorizar mobilidade e aquecimento completo. Cargas progressivas e controladas.".formatted(age);
        }

        String volumeContext = switch (frequency) {
            case 3 -> "Divisão de treino em 3 dias: treinos devem ser DENSOS e completos (Full Body ou Push/Pull/Legs condensado). Cada sessão deve cobrir mais grupos musculares.";
            case 4 -> "Divisão de treino em 4 dias: Upper/Lower ou Push/Pull split. Distribuição equilibrada entre membros superiores e inferiores.";
            case 5 -> "Divisão de treino em 5 dias: treinos bem distribuídos por grupo muscular. Um grupo principal por dia com auxiliares.";
            case 6 -> "Divisão de treino em 6 dias: treinos distribuídos e focados. Um grupo muscular principal por sessão com volume controlado para permitir recuperação.";
            default -> "Divisão de treino em %d dias: distribua adequadamente os grupos musculares.".formatted(frequency);
        };

        return """
            Você é um personal trainer especialista de elite. Gere uma rotina completa de treinos dividida em %d dias para um aluno com o seguinte perfil:
            - Nível: %s
            - Idade: %d anos
            - Peso: %.1f kg
            - Altura: %.1f cm
            - Objetivo: %s
            - Frequência semanal: %d dias

            DIRETRIZES FISIOLÓGICAS:
            - Diretriz de nível: %s
            - Contexto metabólico: %s
            - Contexto de volume: %s
            - Objetivo específico: %s

            REGRA DE CARGA E INTENSIDADE: O app é para academias. Forneça uma sugestão de carga inicial realista baseada no nível e peso do aluno (%.1f kg), mas COMBINE isso com uma métrica de percepção de esforço (RPE ou RIR) para garantir segurança. Exemplo: "Halteres de 12kg (RPE 8)", "20kg de cada lado (Deixando 2 reps na reserva)", "Polia 35kg (Fadiga próxima à falha)". Evite usar apenas "Corpo" a menos que seja estritamente necessário (ex: Barra Fixa).

            REGRA DE MÚCULOS TRABALHADOS: Ao gerar o músculo correspondente ao exercício proposto, siga apenas com estes grupos definidos -> PEITO,OMBRO,TRICEPS,BICEPS,COSTAS,ANTEBRACO,QUADRICEPS,POSTERIOR,GLUTEOS,PANTURRILHA. Evite termos genéricos como "perna" ou "braço".

            REGRA DE NOME DE TREINO: O nome do treino (title) deve corresponder aos exercícios sugeridos. Ex: peito/triceps/ombro = "PUSH DAY". Costas/biceps = "PULL DAY". Quadriceps/posterior/glúteos = "LEG DAY". Treino completo = "FULL BODY". Adapte conforme a divisão escolhida.

            REGRA DE VOLUME DE EXERCÍCIOS:
            - Volume Total: Gere rigorosamente de 6 a 8 exercícios por sessão para manter o treino eficiente e com duração adequada.
            - Distribuição: Grupos musculares maiores (PEITO, COSTAS, QUADRICEPS, POSTERIOR) podem receber de 2 a 4 exercícios. Grupos menores (BICEPS, TRICEPS, PANTURRILHA, ANTEBRACO) devem receber no máximo 1 a 2 exercícios, considerando o estímulo indireto já recebido nos exercícios compostos.

            REGRA DE DESCANSO: Para hipertrofia, sugira descanso entre 90-180s. Para perda de gordura, sugira descanso entre 60-90s. Para performance/força, sugira descanso entre 2-5 minutos. Adapte de acordo com o objetivo principal.

            O resultado deve ser ESTRITAMENTE um ARRAY JSON contendo exatamente %d objetos, sem nenhum texto adicional, sem saudações e sem blocos de código Markdown (como ```json ou ```).

            O array deve obedecer exatamente à seguinte estrutura:
            [
            {
                "title": "NOME DO TREINO (ex: PUSH DAY)",
                "subtitle": "MÚSCULOS TRABALHADOS (ex: PEITO / OMBRO / TRÍCEPS)",
                "tag": "DIA A",
                "data": [
                {
                    "name": "Nome do Exercício, ex: Supino Reto com Barra",
                    "muscles": "PEITO",
                    "type": "COMPOSTO ou ISOLADO",
                    "sets": 4,
                    "reps": "8-12 ou 10 cada",
                    "weight": "Sugestão com RPE, ex: 20kg de cada lado (RPE 8)",
                    "restTime": "Tempo de descanso ex: 90s"
                }
                ]
            }
            ]

            Gere a lista 'data' com 6 a 8 exercícios em CADA UM dos %d treinos. Retorne APENAS o array JSON válido, pronto para ser parseado.
                """
                .formatted(frequency, level, age, weight, height, goal, frequency, focus, metabolismContext, volumeContext, goalContext, weight, frequency, frequency);
    }
}

