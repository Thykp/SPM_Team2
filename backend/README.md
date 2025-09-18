# Backend Microservice Architecture
```bash
eza --tree --level=3 --git-ignore --ignore-glob 'node_modules|__pycache__|venv|.git|.idea|*.pyc|*.log'

tree -a -I 'node_modules|__pycache__|venv|.git|.idea|*.pyc|*.log' -L 3
```

## Instructions
```bash
docker-compose up -d --build
docker-compose down
```

## Starting Individual Services

### JavaScript + Express
```bash
npm i
npm run start
```

### Golang + Gin
```bash
go mod tidy
go run main.go
```

### Java + Spring Boot
```bash
mvn clean install
mvn spring-boot:run
```



