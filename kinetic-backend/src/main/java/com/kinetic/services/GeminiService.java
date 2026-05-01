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

import java.util.List;

@Service
public class GeminiService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    public GeminiService(ObjectMapper objectMapper) {
        this.restClient = RestClient.builder().build();
        this.objectMapper = objectMapper;
    }

    public List<GeneratedWorkoutPlanDto> generateWorkoutPlan(String level) {
        String prompt = buildPrompt(level);

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
            return objectMapper.readValue(jsonText, new com.fasterxml.jackson.core.type.TypeReference<List<GeneratedWorkoutPlanDto>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse Gemini API response into List<GeneratedWorkoutPlanDto>: " + jsonText,
                    e);
        }
    }

    private String buildPrompt(String level) {
        String focus = switch (level.toUpperCase()) {
            case "INICIANTE" -> "Foco em Resistência/Adaptação Muscular.";
            case "INTERMEDIARIO" -> "Foco em Hipertrofia.";
            case "PRO" -> "Foco em Alto Rendimento/Força.";
            default -> "Foco em Condicionamento Geral.";
        };

        return """
                Você é um personal trainer especialista de elite. Gere uma rotina completa de treinos dividida em 3 dias (ABC - Push, Pull, Legs) para um aluno de nível %s que treina em uma academia focada em musculação.
                A diretriz fisiológica principal para este nível é: %s

                REGRA DE CARGA: O app é para academias. Você DEVE fornecer uma sugestão de carga inicial realista para cada exercício baseada no nível do aluno (ex: "Halteres de 12kg", "20kg de cada lado", "Polia 35kg", "Máquina 40kg"). Evite usar apenas "Corpo" a menos que seja estritamente necessário (ex: Barra Fixa).

                O resultado deve ser ESTRITAMENTE um ARRAY JSON contendo exatamente 3 objetos, sem nenhum texto adicional, sem saudações e sem blocos de código Markdown (como ```json ou ```).

                O array deve obedecer exatamente à seguinte estrutura:
                [
                  {
                    "title": "PUSH DAY",
                    "subtitle": "PEITO / OMBRO / TRÍCEPS",
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
                  },
                  {
                    "title": "PULL DAY",
                    "subtitle": "COSTAS / BÍCEPS",
                    "tag": "DIA B",
                    "data": [
                       // Pelo menos 6 a 8 exercícios
                    ]
                  },
                  {
                    "title": "LEG DAY",
                    "subtitle": "QUADRÍCEPS / POSTERIOR / PANTURRILHA",
                    "tag": "DIA C",
                    "data": [
                       // Pelo menos 6 a 8 exercícios
                    ]
                  }
                ]

                Gere rigorosamente de 6 a 8 exercícios na lista 'data' de CADA UM dos 3 treinos. Retorne APENAS o array JSON válido.
                """
                .formatted(level, focus);
    }
}
