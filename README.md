# SPM_Team2

## Prerequisite
Node.js <br>
Database Credentials <br>

## Instructions

Switch to your branch before starting to code:
```bash
  git checkout -b your-branch-name
```

<br>

> Local Setup
1. Open a terminal and run the following command:
```bash
  cd backend

```
<br>

2. Open another terminal and run the following command:
```bash
  cd frontend
  npm i
  npm run dev
```

## Solution Architecture (Draft)

## DevOps CI/CD Pipelines

## Cloud Architecture
<img width="854" height="459" alt="Screenshot 2025-07-22 at 5 16 49 PM" src="https://github.com/user-attachments/assets/65a17bd1-ba1b-411d-9f09-5ea4c500cc3c" />
<p>
  Backend Spring Boot Application image built and stored on ECS and deployed via Fargate for auto scaling <br>
  Frontend deployed as static asset, stored in S3 and distributed via Cloudfront CDN
</p>