# Bước 1: Build file JAR
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
# Giới hạn bộ nhớ cho Maven khi build để không bị ngốn RAM
ENV MAVEN_OPTS="-Xmx384m"
RUN mvn clean package -DskipTests

# Bước 2: Chạy ứng dụng với JRE 17
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Cấu hình giới hạn bộ nhớ cho Spring Boot
ENV JAVA_OPTS="-Xms256m -Xmx384m -XX:+UseSerialGC"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
