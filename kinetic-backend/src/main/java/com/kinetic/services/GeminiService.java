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

    public GeneratedWorkoutPlanDto generateWorkoutPlan(String level) {
        String prompt = buildPrompt(level);

        GeminiRequestDto requestDto = new GeminiRequestDto(
                List.of(GeminiRequestDto.Content.of(prompt)),
                GeminiRequestDto.GenerationConfig.json()
        );

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
            return objectMapper.readValue(jsonText, GeneratedWorkoutPlanDto.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse Gemini API response into GeneratedWorkoutPlanDto: " + jsonText, e);
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
            Você é um personal trainer especialista de elite. Gere uma ficha de treino para um aluno de nível %s.
            A diretriz principal para este nível é: %s
            
            O resultado deve ser ESTRITAMENTE um objeto JSON que obedeça exatamente à seguinte estrutura, sem nenhum texto adicional ou blocos de código Markdown (como ```json):
            {
              "title": "Nome curto do treino, ex: PUSH DAY, PULL DAY, LEG DAY, FULL BODY",
              "subtitle": "Grupos musculares principais, ex: PEITO / OMBRO / TRÍCEPS",
              "tag": "Tag visual curta, ex: DIA A, DIA B",
              "data": [
                {
                  "name": "Nome do Exercício, ex: Supino Reto com Barra",
                  "muscles": "Músculo principal, ex: PEITO, COSTAS, OMBRO, QUADRÍCEPS",
                  "type": "COMPOSTO ou ISOLADO",
                  "sets": 4,
                  "reps": "8-10 ou 10 cada",
                  "weight": "Sugestão de peso ex: 80kg ou Corpo",
                  "restTime": "Tempo de descanso ex: 90s"
                }
              ]
            }
            
            Gere pelo menos 6 a 8 exercícios na lista 'data'.
            """.formatted(level, focus);
    }
}
