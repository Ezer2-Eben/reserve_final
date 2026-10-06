# Étape 1 : Construction de l'application (Build)
FROM maven:3.9.5-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# Étape 2 : Exécution (Run) — free tier Render ~512 Mo
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/target/webApp-reserve-admin-0.0.1-SNAPSHOT.jar app.jar

# Render injecte PORT ; on écoute 0.0.0.0 via application-prod.properties
EXPOSE 10000

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Xms128m"

# Profil prod + junk de démarrage plus tolérant
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dspring.profiles.active=prod -jar app.jar"]
