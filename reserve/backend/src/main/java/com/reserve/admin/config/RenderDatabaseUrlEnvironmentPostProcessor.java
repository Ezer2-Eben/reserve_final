package com.reserve.admin.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Convertit DATABASE_URL (Render: postgres://user:pass@host:5432/db)
 * en propriétés Spring JDBC avant le démarrage du contexte.
 */
public class RenderDatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String existingJdbc = firstNonBlank(
                environment.getProperty("SPRING_DATASOURCE_URL"),
                environment.getProperty("spring.datasource.url")
        );
        if (existingJdbc != null && existingJdbc.startsWith("jdbc:")) {
            return;
        }

        String databaseUrl = firstNonBlank(
                environment.getProperty("DATABASE_URL"),
                environment.getProperty("database.url")
        );
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return;
        }

        try {
            String normalized = databaseUrl.replaceFirst("^postgres://", "postgresql://");
            URI uri = URI.create(normalized);
            String userInfo = uri.getUserInfo();
            if (userInfo == null || userInfo.isBlank()) {
                System.err.println("[RenderDB] DATABASE_URL sans user:password — ignoré");
                return;
            }

            String[] parts = userInfo.split(":", 2);
            String username = URLDecoder.decode(parts[0], StandardCharsets.UTF_8);
            String password = parts.length > 1
                    ? URLDecoder.decode(parts[1], StandardCharsets.UTF_8)
                    : "";

            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String path = uri.getPath() == null ? "" : uri.getPath();
            String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + path;
            if (!jdbcUrl.contains("sslmode=")) {
                jdbcUrl = jdbcUrl + "?sslmode=require";
            }

            Map<String, Object> props = new HashMap<>();
            props.put("spring.datasource.url", jdbcUrl);
            props.put("spring.datasource.username", username);
            props.put("spring.datasource.password", password);
            props.put("spring.datasource.driver-class-name", "org.postgresql.Driver");
            props.put("SPRING_DATASOURCE_URL", jdbcUrl);
            props.put("SPRING_DATASOURCE_USERNAME", username);
            props.put("SPRING_DATASOURCE_PASSWORD", password);

            environment.getPropertySources().addFirst(
                    new MapPropertySource("renderDatabaseUrl", props)
            );
            System.out.println("[RenderDB] DATABASE_URL converti en JDBC vers "
                    + uri.getHost() + ":" + port + path);
        } catch (Exception e) {
            System.err.println("[RenderDB] Échec conversion DATABASE_URL: " + e.getMessage());
        }
    }

    private static String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank() && !"null".equalsIgnoreCase(v)) {
                return v;
            }
        }
        return null;
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
