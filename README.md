# 🏆 면시 프로젝트 소개
면시(면접시뮬레이터)는 AI 기반 캐릭터를 통해 면접을 돕는 애플리케이션입니다. 

</br>

```
대부분의 구직자는 잘 모르는 사실이지만, 면접관들도 면접 전 긴장을 한다.

혹여 내 실수로 좋은 사람을 놓치는 것은 아닐지, 반대로 팀과 맞지 않는 사람을 채용하는 것은 아닐지 걱정한다.

이런 고민은 회사에 대한 애정이 커질수록 더 깊어진다.


하지만 현실적으로 면접 시간 1시간만으로 지원자를 깊이 파악하기란 어렵다.

때로는 한 번 더 면접을 보고 싶은데, 구직자 입장에서는 그 말이 부담스럽게 다가올 수도 있다.
```

</br>

대부분의 구직자는 다음과 같은 자료를 제출합니다.
- 자기소개서
- 이력서
- 포트폴리오
- 블로그, 노션, GitHub 링크 등
  
</br>

✅ **이러한 자료들을 AI가 학습하여 지원자의 AI 캐릭터를 생성하고, 이를 활용해 면접을 예행 연습할 수 있다면 어떨까요?**</br>

✅ **그리고 이 캐릭터와 대화를 나눈 후, 실제 지원자와 비교하여 평가할 수 있다면?**

</br>

- 면접관은 AI 캐릭터와 모의 면접을 진행하며 질문을 미리 준비할 수 있다.
- 구직자는 AI 면접을 통해 자신의 강점과 약점을 분석하고, 실전 면접을 대비할 수 있다.
- AI 캐릭터의 답변과 실제 지원자의 답변을 비교하여 평가할 수도 있다.

</br>

## 🎯 타겟 유저

- 면접관: 지원자의 정보를 미리 검토하고, 효과적인 질문을 준비하고 싶은 사람
- 구직자: 모의 면접을 통해 연습하고, 자신의 프로필을 더 많은 사람에게 알리고 싶은 사람
- 인사팀 / 헤드헌터: 링크드인에서 찾은 인재가 정말 좋은 인재인지 사전 검토하고 싶은 사람


</br>

## 🧑‍💻 사용 시나리오

###  면접관
1. 면접 대상자의 기본 정보 입력 (이름, 직군 선택)
2. 이력서 & 자기소개서 업로드
3. GitHub / LinkedIn 링크 추가 → 공개된 데이터 크롤링 & 분석 (선택 사항)
4. 성격 태그 선택 (예: 친절함, 과묵함, 대화형, 논리적, 감성적 등)
5. AI 캐릭터 생성 후, 면접 시뮬레이션 진행

###  구직자
- 위 과정과 동일하나, 목적이 다름 → 자신의 프로필을 AI 기반으로 보강하고, 면접 제안 받을 기회 확대
- AI 면접을 통해 예상 질문을 미리 경험하고, 부족한 점을 보완 가능
- 대화 로그를 바탕으로 주로 어떤 질문을 받았는지 확인 가능

###  피플팀 / 헤드헌터
- AI 면접을 통해 사전 검증 후, 유망한 인재에게만 직접 연락 가능
- 불필요한 DM/미팅을 줄이고, 진짜 적합한 후보에게 집중할 수 있음


<br>

# BackEnd
하위에서는 백엔드 설계 및 리소스에 대해 설명을 진행합니다.

- [API 문서 확인하러 가기](http://resupath.click/api/swagger#/)
- [프론트 레포지토리 구경하러 가기](https://github.com/Resupath/frontend)


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
로컬에서 아래 방법으로 서버를 실행시킬 수 있습니다.

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

## ⚙️ Swagger 문서화
- [배포된 스웨거 문서 확인하러 가기](http://resupath.click/api/swagger#/)
nestia를 이용한 스웨거 문서 생성을 지원합니다.

```sh
npx nestia swagger
```
명령어 실행후 [http://localhost:3000/api/swagger](http://localhost:3000/api/swagger)에 접속하면 로컬에서도 api 문서를 확인가능합니다.
<br>

## ⚙️ Sdk 
nestia를 이용한 sdk 배포를 진행하고 있습니다.

- [npm 배포 링크 확인하러 가기](https://www.npmjs.com/package/@rimo030/resupath-backend)

```sh
npm i @rimo030/resupath-backend
```
위 명령어로 npm install 후 사용해 볼 수 있습니다.

<br>



