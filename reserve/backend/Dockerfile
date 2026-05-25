# Étape 1 : Construction de l'application (Build)
FROM maven:3.9.5-eclipse-temurin-17 AS build
WORKDIR /app

# Copier le fichier pom.xml et télécharger les dépendances (mise en cache)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copier le code source et compiler
COPY src ./src
RUN mvn clean package -DskipTests

# Étape 2 : Exécution de l'application (Run)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copier le JAR généré depuis l'étape de construction
COPY --from=build /app/target/webApp-reserve-admin-0.0.1-SNAPSHOT.jar app.jar

# Exposer le port (Render écoute le port configuré ou 9190)
EXPOSE 9190

# Commande de démarrage
ENTRYPOINT ["java", "-jar", "app.jar"]
