package com.kinetic.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

/**
 * Datas com hora saem da API como instante UTC explícito ("2026-10-14T04:27:10.839Z").
 *
 * Sem o "Z", o cliente lia o horário como se fosse do fuso dele e mostrava tudo
 * 3h adiantado no Brasil. Os LocalDateTime da aplicação estão no fuso da JVM
 * (o Hibernate converte as colunas TIMESTAMPTZ para ele), então a conversão usa
 * o fuso da JVM. Milissegundos: é o formato de data do JavaScript, aceito por
 * todos os motores (navegador e Hermes no app). Vale para toda a API REST.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer localDateTimeAsUtcInstant() {
        return builder -> builder.serializerByType(LocalDateTime.class, new LocalDateTimeAsUtcSerializer());
    }

    static class LocalDateTimeAsUtcSerializer extends StdSerializer<LocalDateTime> {

        LocalDateTimeAsUtcSerializer() {
            super(LocalDateTime.class);
        }

        @Override
        public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider provider) throws IOException {
            gen.writeString(value.atZone(ZoneId.systemDefault())
                    .toInstant()
                    .truncatedTo(ChronoUnit.MILLIS)
                    .toString());
        }
    }
}
