package com.kinetic.it;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SchemaIT extends IntegrationTestBase {

    @Autowired
    private DataSource dataSource;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private Flyway flyway;

    /** Trava: o .env local aponta para o banco real; os testes só podem usar o container. */
    @Test
    void usesTheDisposableContainer() throws Exception {
        try (Connection c = dataSource.getConnection()) {
            assertEquals(POSTGRES.getJdbcUrl(), c.getMetaData().getURL());
        }
    }

    /** O contexto subir já prova que o Hibernate (ddl-auto=validate) aceitou o schema migrado. */
    @Test
    void migrationsApplyOnTopOfProductionSchema() {
        assertEquals(0, flyway.info().pending().length);
    }

    /** Toda tabela nova precisa de ENABLE ROW LEVEL SECURITY: sem isso a Data API do Supabase a expõe. */
    @Test
    void everyPublicTableHasRowLevelSecurity() {
        // flyway_schema_history nasce aqui pelo Flyway; em produção o RLS dela já está ligado.
        List<String> withoutRls = jdbc.queryForList("""
                SELECT tablename FROM pg_tables
                WHERE schemaname = 'public' AND NOT rowsecurity AND tablename <> 'flyway_schema_history'
                ORDER BY tablename""", String.class);
        assertEquals(List.of(), withoutRls);
    }
}
