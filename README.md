# SPM_Team2

## Prerequisite
IDE (Any) <br>
Node Package Manager (npm) <br>
Github Desktop (If you prefer else CLI) <br>
Docker <br>

## Instructions

Switch to your branch before starting to code <br>
```bash
  git checkout -b your-branch-name
```

<br>

> Local Setup, ensure Docker Desktop is running
1. Open a terminal and run the following command:
```bash
  docker-compose up -d --build
  docker-compose down
```
2. Open another terminal and run the following command:
```bash
  cd frontend
  npm i
  npm run dev
```

## Solution Architecture (Draft)
<img width="919" height="461" alt="Screenshot 2025-10-23 at 1 23 06 PM" src="https://github.com/user-attachments/assets/05463f96-56df-413b-8ea8-065cc42adb67" />


## CI Pipeline
### Key Workflows
- Merge to main

<img width="737" height="568" alt="Screenshot 2025-10-23 at 12 52 03 PM" src="https://github.com/user-attachments/assets/eff9490c-5854-46a5-be32-256aff8139b1" />


## Frameworks and Databases Utilised

<p align="center"><strong>UI Stack</strong></p>
<p align="center">
<a href="https://vitejs.dev/"><img src="https://upload.wikimedia.org/wikipedia/commons/f/f1/Vitejs-logo.svg" alt="Vite" width="40"/></a>&nbsp;&nbsp;
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png" alt="JavaScript" width="40"/></a>&nbsp;&nbsp;
<a href="https://www.typescriptlang.org/"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Typescript_logo_2020.svg/1200px-Typescript_logo_2020.svg.png" alt="TypeScript" width="40"/></a>&nbsp;&nbsp;
<a href="https://react.dev/"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React" width="40"/></a>&nbsp;&nbsp;
<a href="https://tailwindcss.com/"><img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" alt="Tailwind" width="50"/></a>&nbsp;&nbsp;
<a href="https://ui.shadcn.com/"><img src="https://github.com/user-attachments/assets/dd2eb75e-28c6-46e5-bb11-734e9e9a04f3" alt="ShadCN" width="30"/></a>&nbsp;&nbsp;
<a href="https://supabase.com/auth"><img src="https://www.vectorlogo.zone/logos/supabase/supabase-icon.svg" alt="Supabase" width="40"/></a>&nbsp;&nbsp;
<br>
<i>Vite · JavaScript · TypeScript · React · Tailwind CSS · ShadCN · Supabase Auth</i>
</p>
<br>

<p align="center"><strong>Microservices Languages</strong></p>
<p align="center">
<a href="https://go.dev/"><img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Go_Logo_Blue.svg" alt="Golang" width="80"/></a>&nbsp;&nbsp;
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png" alt="JavaScript" width="40"/></a>&nbsp;&nbsp;
<a href="https://www.typescriptlang.org/"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Typescript_logo_2020.svg/1200px-Typescript_logo_2020.svg.png" alt="TypeScript" width="40"/></a>&nbsp;&nbsp;
<a href="https://www.typescriptlang.org/"><img src="https://upload.wikimedia.org/wikipedia/it/2/2e/Java_Logo.svg" alt="Java" width="30"/></a>&nbsp;&nbsp;
<a href="https://www.python.org/"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/1024px-Python-logo-notext.svg.png" alt="Python" width="40"/></a>&nbsp;&nbsp;
<br>
<i>Golang · JavaScript · TypeScript · Java · Python</i>
</p>
<br>

<p align="center"><strong>Microservices Frameworks</strong></p>
<p align="center">
<a href="https://gin-gonic.com/"><img src="https://raw.githubusercontent.com/gin-gonic/logo/master/color.png" alt="Gin" width="40"/></a>&nbsp;&nbsp;
<a href="https://expressjs.com/"><img src="https://upload.wikimedia.org/wikipedia/commons/6/64/Expressjs.png" alt="ExpressJS" width="100"/></a>&nbsp;&nbsp;
<a href="https://expressjs.com/"><img src="https://upload.wikimedia.org/wikipedia/commons/7/79/Spring_Boot.svg" alt="Spring" width="40"/></a>&nbsp;&nbsp;
<a href="https://fastapi.tiangolo.com/"><img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/FastAPI_logo.svg" alt="FastAPI" width="120"/></a>&nbsp;&nbsp;
<br>
<i>Gin · Express · Spring Boot · FastAPI</i>
</p>
<br>

<p align="center"><strong>API Gateway</strong></p>
<p align="center">
<a href="https://konghq.com/"><img src="https://konghq.com/wp-content/uploads/2018/08/kong-combination-mark-color-256px.png" alt="Kong API Gateway" width="88"/></a>
<br>
<i>CORS · Rate Limit Plugin · Prometheus</i>
</p>
<br>  

<p align="center"><strong>Storage Solutions</strong></p>  
<p align="center">
<a href="https://supabase.com/"><img src="https://www.vectorlogo.zone/logos/supabase/supabase-icon.svg" alt="Supabase" width="40" /></a>&nbsp;&nbsp;
<br>
<i>Supabase</i>
</p>
<br> 

<p align="center"><strong>Message Brokers</strong></p>
<p align="center">
<a href="https://kafka.apache.org/"><img src="https://upload.wikimedia.org/wikipedia/commons/0/01/Apache_Kafka_logo.svg" alt="Kafka" width="25"/></a>
<br>
<i>Kafka</i>
</p>
<br> 


<p align="center"><strong>Inter-service Communications</strong></p>
<p align="center">
<a href="https://restfulapi.net/"><img src="https://keenethics.com/wp-content/uploads/2022/01/rest-api-1.svg" alt="REST API" width="100"/></a>
<br>
<i>REST API</i>
</p> 
<br>

<p align="center"><strong>DevSecOps and Site Reliability</strong></p>
<p align="center">
<a href="https://github.com/features/actions"><img src="https://github.com/user-attachments/assets/84046b86-7745-4ddd-8c36-b39b6a9ead91" alt="GitHub Actions" width="60"/></a>&nbsp;&nbsp;
<a href="https://grafana.com/"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e6/Sonarqube-48x200.png" alt="SonarQube" width="130"/></a>&nbsp;&nbsp;
<br>
<i>Github Actions · SonarQube</i>
</p> 
<br>

<p align="center"><strong>Other Technologies</strong></p>
<p align="center">
<a href="https://www.docker.com/"><img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Docker_%28container_engine%29_logo.svg" alt="Docker" width="150"/></a>&nbsp;&nbsp;
<a href="https://socket.io/"><img src="https://upload.wikimedia.org/wikipedia/commons/9/96/Socket-io.svg" alt="Socket.io" width="40"/></a>&nbsp;&nbsp;
</p>
<p align="center">
<i>Docker Compose · Docker Hub · Socket.io</i>
</p>
<br> 

## Contributors

**Team 2**

<div align="center">
    <table>
        <tr>
            <th><a href="https://www.linkedin.com/in/phoebeneo/">Phoebe</a></th>
            <th><a href="https://www.linkedin.com/in/wongyaohui/">Yao Hui</a></th>
            <th><a href="https://www.linkedin.com/in/yu-feng-leong/">Yu Feng</a></th>
            <th><a href="https://www.linkedin.com/in/kendrick-poon/">Kendrick</a></th>
            <th><a href="https://www.linkedin.com/in/utkarsh-tayal24/">Utkarsh</a></th>
            <th><a href="https://www.linkedin.com/in/gerald-chee-si-hao/">Gerald</a></th>
        </tr>
        <!-- <tr>
            <td><img src="https://github.com/user-attachments/assets/80d01dda-0d39-4648-b695-5ed0367d2777" alt="Ryan" width="120" height="120" style="display:block; margin:0 auto;"></td>
            <td><img src="https://github.com/user-attachments/assets/aa289832-1d5d-4a4c-b8dc-15732eebc691" alt="Saurabh" width="120" height="120" style="display:block; margin: 0 auto;"></td>
            <td><img src="https://github.com/user-attachments/assets/fc41231a-1d80-4fdc-9c08-b89ead1b6b20" alt="Kendrick" width="120" height="120" style="display:block; margin: 0 auto;"></td>
            <td><img src="https://github.com/user-attachments/assets/47010ac4-2697-48bd-9083-7f6e91c0e49e" alt="Kevin" width="120" height="120" style="display:block; margin: 0 auto;"</td>
            <td><img src="https://github.com/user-attachments/assets/36147165-6866-489c-9642-bf9dd37590f2" alt="Ewan" width="120" height="120" style="display:block; margin: 0 auto;"></td>
        </tr> -->
    </table>
</div>

