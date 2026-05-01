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
            throw new RuntimeException("Failed to parse Gemini API response into List<GeneratedWorkoutPlanDto>. Check server logs for details.", e);
        }
    }

    private String buildPrompt(String level, int age, double weight, double height, String goal, int frequency) {
        String focus = switch (level.toUpperCase()) {
            case "INICIANTE" -> "Foco em Resistência/Adaptação Muscular.";
            case "INTERMEDIARIO" -> "Foco em Hipertrofia.";
            case "PRO" -> "Foco em Alto Rendimento/Força.";
            default -> "Foco em Condicionamento Geral.";
        };

        String goalContext = switch (goal.toUpperCase()) {
            case "GANHO DE MASSA" -> "O objetivo principal é HIPERTROFIA e ganho de massa muscular. Priorize exercícios compostos pesados e volume adequado.";
            case "PERDA DE GORDURA" -> "O objetivo principal é PERDA DE GORDURA. Inclua circuitos metabólicos, supersets e sugira cardio HIIT pós-treino.";
            case "PERFORMANCE" -> "O objetivo principal é PERFORMANCE ATLÉTICA. Foque em exercícios funcionais, explosivos e de potência.";
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
                - Altura: %.0f cm
                - Objetivo: %s
                - Frequência semanal: %d dias

                DIRETRIZES FISIOLÓGICAS:
                - Diretriz de nível: %s
                - Contexto metabólico: %s
                - Contexto de volume: %s
                - Objetivo específico: %s

                REGRA DE CARGA: O app é para academias. Você DEVE fornecer uma sugestão de carga inicial realista para cada exercício baseada no nível e peso do aluno (ex: "Halteres de 12kg", "20kg de cada lado", "Polia 35kg", "Máquina 40kg"). Considere que o aluno pesa %.1f kg para calibrar as sugestões. Evite usar apenas "Corpo" a menos que seja estritamente necessário (ex: Barra Fixa).

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
                        "weight": "Sugestão exata, ex: 20kg de cada lado",
                        "restTime": "Tempo de descanso ex: 90s"
                      }
                    ]
                  }
                ]

                Gere rigorosamente de 6 a 8 exercícios na lista 'data' de CADA UM dos %d treinos. Adapte os nomes dos treinos (title), subtítulos e tags (DIA A, DIA B, etc.) conforme a divisão escolhida. Retorne APENAS o array JSON válido.
                """
                .formatted(frequency, level, age, weight, height, goal, frequency, focus, metabolismContext, volumeContext, goalContext, weight, frequency, frequency);
    }
}

