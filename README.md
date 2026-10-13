Лабораторна робота №1 — AWS Deployment
Виконала: студентка групи ІР-34, Вітів Анастасія

## Опис застосунку
Ship Catalog — вебзастосунок і REST API для перегляду, пошуку та фільтрації кораблів. Сервер написаний на Node.js та Express, дані зберігаються в MySQL.

## Публічне розгортання
- URL: http://web1lab-alb-464974951.eu-central-1.elb.amazonaws.com/
- Health check: `/health`
- Список кораблів: `/api/ships`

## Архітектура
- Amazon ECR — приватний реєстр Docker-образів.
- Amazon ECS Fargate — запуск контейнера.
- Amazon RDS for MySQL — керована SQL-база.
- Application Load Balancer — публічний вхідний endpoint.
- VPC, підмережі, NAT Gateway та Security Groups — Terraform.
- GitHub Actions + GitHub OIDC — автоматичне розгортання.

База даних і ECS tasks розміщені у приватних підмережах; з інтернету доступний ALB.
Використані технології
AWS: ECS Fargate, ECR (Elastic Container Registry), RDS MySQL, Application Load Balancer, VPC (Private/Public subnets, NAT Gateway).

IaC & CI/CD: Terraform, GitHub Actions із безпечною автентифікацією через OIDC (без довговічних Access Keys у секретах).

DevOps: Docker, Docker Compose.

Структура проєкту: 

Web1.lab/
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD пайплайн для автоматичного деплою через OIDC
├── terraform/                # Terraform конфігурація AWS інфраструктури
│   ├── vpc.tf                # Мережева інфраструктура (VPC, підмережі, NAT)
│   ├── ecs.tf                # ECS Cluster, Task Definition та Service
│   ├── ecr.tf                # Приватний ECR репозиторій для Docker-образів
│   ├── rds.tf                # Керована база даних RDS MySQL
│   ├── alb.tf                # Application Load Balancer та Target Group
│   └── github-oidc.tf        # IAM роль, політики та OIDC провайдер
├── compose.yaml              # Локальний Docker Compose стек
├── Dockerfile                # Dockerfile для Node.js застосунку
├── server.js                 # Express REST API сервер
├── database.js               # Логіка підключення до бази даних
├── init.sql                  # Початкова схема БД
├── .gitignore
└── README.md
