package com.reserve.admin.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Aligne la contrainte CHECK du rôle PostgreSQL avec l'enum Java (SUPER_ADMIN).
 * Sans ça, Hibernate/ddl-auto ou les inserts peuvent faire échouer le démarrage.
 */
@Component
@Profile("prod")
@Order(1)
public class PostgresRoleConstraintFix implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PostgresRoleConstraintFix.class);
    private final JdbcTemplate jdbcTemplate;

    public PostgresRoleConstraintFix(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            Integer exists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.tables " +
                            "WHERE table_schema = 'public' AND table_name = 'utilisateur'",
                    Integer.class
            );
            if (exists == null || exists == 0) {
                return;
            }

            jdbcTemplate.execute(
                    "ALTER TABLE utilisateur DROP CONSTRAINT IF EXISTS utilisateur_role_check"
            );
            jdbcTemplate.execute(
                    "ALTER TABLE utilisateur ADD CONSTRAINT utilisateur_role_check " +
                            "CHECK (role IN ('ADMIN', 'USER', 'SUPER_ADMIN'))"
            );
            log.info("Contrainte utilisateur_role_check alignée (ADMIN, USER, SUPER_ADMIN)");
        } catch (Exception e) {
            log.warn("Impossible d'aligner utilisateur_role_check: {}", e.getMessage());
        }
    }
}
