# syntax=docker/dockerfile:1

FROM gradle:8.14.3-jdk17 AS build
WORKDIR /app

COPY gradle gradle
COPY gradlew gradlew
COPY build.gradle.kts settings.gradle.kts ./
COPY src src

RUN chmod +x gradlew
RUN --mount=type=cache,target=/root/.gradle ./gradlew bootJar -x test --no-daemon

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/build/libs/*.jar /app/app.jar

EXPOSE 43261
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
