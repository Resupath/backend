
## ⭐ 프로젝트 소개
Resupath의 백엔드 레포지토리 입니다.

<br>

## 📚 기술 스택

| 분류          | 기술 스택                                                                                                                                                                                                                                                                                                                                                                      |
| :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language      | [![](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=TypeScript&logoColor=white)]()                                                                                                                                                                                                                                                                      |
| Backend       | [![](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=Node.js&logoColor=white)]() [![](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=NestJS&logoColor=white)]() [![](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=Prisma&logoColor=white)]() |
| DB            | [![](https://img.shields.io/badge/postgresql-4169E1?style=flat-square&logo=postgresql&logoColor=white)]()                                                                                                                                                                                                                                                                                |
| Testing       | [![](https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=Jest&logoColor=white)]()                                                                                                                                                                                                                                                                                  |
| DevOps        | [![](https://img.shields.io/badge/github-181717?style=flat-square&logo=github&logoColor=white)]() [![](https://img.shields.io/badge/github%20action-2088FF?style=flat-square&logo=githubactions&logoColor=white)]()   [![](https://img.shields.io/badge/AWS-232F3E?style=flat-square&logo=amazonwebservices&logoColor=white)]() [![](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=Docker&logoColor=white)]()                                                                      |
| Documentation | [![](https://img.shields.io/badge/Swagger-83B81A?style=flat-square&logo=Swagger&logoColor=white)]()                                                                                                                                                                                                                                                                            |
<br>

## 📌 프로젝트 실행
로컬에서 아래 방법으로 서버를 실행시킬수 있습니다.

### 1. 설치
```sh
git clone https://github.com/Resupath/backend.git
```
```sh
cd Resupath/backend/
```
```sh
npm install
```
<br>

### 2. `.env` 파일작성
[.env.example](https://github.com/Resupath/backend/blob/main/.env.example) 파일을 참고해 `.env`을 생성합니다.
<br>

### 3. 로컬 DB 세팅
docker-compose를 이용해 postgres 컨테이너를 생성합니다. 
```sh
docker-compose up -d
```
<br>

### 4. DB 스키마 생성
prisma를 이용해 스키마를 생성합니다.
```sh
npx prisma db push
```
<br>

### 5. 서버 실행
아래 명령어로 로컬 서버를 실행시킬수 있습니다.
```sh
$ npm run start

# dev
$ npm run start:dev
```
<br>

### ⚙️ Swagger 생성
nestia를 이용한 스웨거 문서 생성을 지원합니다.
```sh
npx nestia swagger
```
명령어 실행후 [http://localhost:3000/api/swagger](http://localhost:3000/api/swagger)에 접속하면 api 문서를 확인가능합니다.
<br>


