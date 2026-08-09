# Bước 1: Build file JAR từ source code bằng Maven và JDK 17
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml và tải dependencies trước để tối ưu cache của Docker
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy toàn bộ source code và tiến hành build (bỏ qua unit test để deploy nhanh)
COPY src ./src
RUN mvn clean package -DskipTests

# Bước 2: Chạy ứng dụng với JRE 17 siêu nhẹ
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy file jar đã build từ bước 1 sang
COPY --from=build /app/target/*.jar app.jar

# Mở port 8080 (port mặc định của Spring Boot)
EXPOSE 8080

# Lệnh khởi chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]