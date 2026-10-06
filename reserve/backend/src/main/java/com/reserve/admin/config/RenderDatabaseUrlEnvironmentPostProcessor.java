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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Normalise DATABASE_URL / SPRING_DATASOURCE_URL pour PostgreSQL sur Render.
 * Corrige les formats postgres://, jdbc sans port :5432, etc.
 */
public class RenderDatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final Pattern JDBC_NO_PORT = Pattern.compile(
            "^(jdbc:postgresql://[^:/]+)(/.*)$"
    );

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String springUrl = firstNonBlank(environment.getProperty("SPRING_DATASOURCE_URL"));
        String databaseUrl = firstNonBlank(environment.getProperty("DATABASE_URL"));

        try {
            if (springUrl != null) {
                if (springUrl.startsWith("jdbc:")) {
                    applyJdbc(environment, ensurePortAndSsl(springUrl), null, null);
                    return;
                }
                if (springUrl.startsWith("postgres")) {
                    applyFromPostgresUri(environment, springUrl);
                    return;
                }
            }

            if (databaseUrl != null) {
                applyFromPostgresUri(environment, databaseUrl);
                return;
            }

            System.err.println("[RenderDB] Aucune URL PostgreSQL (DATABASE_URL / SPRING_DATASOURCE_URL)");
        } catch (Exception e) {
            System.err.println("[RenderDB] Échec configuration datasource: " + e.getMessage());
        }
    }

    private void applyFromPostgresUri(ConfigurableEnvironment environment, String rawUrl) {
        String normalized = rawUrl.replaceFirst("^postgres://", "postgresql://");
        URI uri = URI.create(normalized);

        String userInfo = uri.getUserInfo();
        if (userInfo == null || userInfo.isBlank()) {
            throw new IllegalStateException("URL PostgreSQL sans identifiants");
        }

        String[] parts = userInfo.split(":", 2);
        String username = URLDecoder.decode(parts[0], StandardCharsets.UTF_8);
        String password = parts.length > 1
                ? URLDecoder.decode(parts[1], StandardCharsets.UTF_8)
                : "";

        int port = uri.getPort() > 0 ? uri.getPort() : 5432;
        String path = uri.getPath() == null ? "" : uri.getPath();
        String jdbcUrl = ensurePortAndSsl("jdbc:postgresql://" + uri.getHost() + ":" + port + path);

        applyJdbc(environment, jdbcUrl, username, password);
        System.out.println("[RenderDB] URL convertie → " + uri.getHost() + ":" + port + path);
    }

    private void applyJdbc(ConfigurableEnvironment environment, String jdbcUrl,
                           String username, String password) {
        Map<String, Object> props = new HashMap<>();
        props.put("spring.datasource.url", jdbcUrl);
        props.put("spring.datasource.driver-class-name", "org.postgresql.Driver");
        props.put("SPRING_DATASOURCE_URL", jdbcUrl);

        if (username != null) {
            props.put("spring.datasource.username", username);
            props.put("SPRING_DATASOURCE_USERNAME", username);
        }
        if (password != null) {
            props.put("spring.datasource.password", password);
            props.put("SPRING_DATASOURCE_PASSWORD", password);
        }

        environment.getPropertySources().addFirst(new MapPropertySource("renderDatabaseUrl", props));
    }

    /** jdbc:postgresql://host/db → jdbc:postgresql://host:5432/db + sslmode=require */
    static String ensurePortAndSsl(String jdbcUrl) {
        Matcher m = JDBC_NO_PORT.matcher(jdbcUrl);
        if (m.matches()) {
            jdbcUrl = m.group(1) + ":5432" + m.group(2);
        }
        if (!jdbcUrl.contains("sslmode=")) {
            jdbcUrl = jdbcUrl.contains("?") ? jdbcUrl + "&sslmode=require" : jdbcUrl + "?sslmode=require";
        }
        return jdbcUrl;
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
