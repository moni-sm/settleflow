# Multi-stage Dockerfile for SettleFlow Spring Boot Backend
FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
COPY mvnw* .
RUN mvn dependency:go-offline -B || true

# Build application JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# Minimal runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Add non-root user for security
RUN addgroup -S settleflow && adduser -S settleflow -G settleflow
USER settleflow

# Copy built artifact
COPY --from=builder --chown=settleflow:settleflow /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
