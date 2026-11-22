# MBTI 검사 & 16유형 가이드

**배포 주소:** https://ckurusa.github.io/namidda_mbti/

- **간편 검사** 20문항(약 3분) / **정밀 검사** 60문항(약 10분)
- 간편 검사에서 선호가 애매한 축만 추가 문항으로 **보완**
- **점쳐보기:** 내 MBTI + 좋아하는 사람의 MBTI + 관계 상황(짝사랑·썸·연애 중·권태기) → 케미 지수와 조언, 내 직군 → 어울림 지수, 직군×유형 매트릭스, 16×16 케미 히트맵 (모두 재미용)
- **공유 이미지 카드:** 결과 카드와 케미 카드를 PNG 로 저장·공유 (브라우저 안에서만 만들어요)
- **16유형 캐릭터:** 글자별 부품을 조합한 SVG 캐릭터 (외부 이미지 없음)
- **검사 결과와 연동:** 결과 화면에서 바로 직장·직업, 연애, 학습법을 확인 (내 선호 강도에 맞춘 팁, 경계 축은 양쪽 모두)
- 16유형 가이드: 성향 · 습관 · 직업 · 연애 · 공부법 · 스트레스 · 궁합

> 공식 MBTI®가 아닌 자기 이해용 간이 검사입니다. 진단이 아니라 참고 자료로 활용하세요.

## 실행
설치할 것이 없습니다. `index.html` 을 브라우저로 열면 됩니다.

## 주소 (블로그 연결용)
| 주소 | 화면 |
|---|---|
| `index.html` | 검사 홈 |
| `index.html#guide` | 16유형 목록 |
| `index.html#ISTJ` | 유형별 가이드 (16유형 코드 모두 가능) |
| `index.html#lab` | 점쳐보기 |
| `index.html#lab/ENFP/love` | 내 유형을 지정한 점쳐보기 (`love` · `job` · `matrix` · `heat`) |

## 테스트
```
node tests/run.js
```
문항 구성, 16유형 도달, 보완/이어하기, 콘텐츠 누락·길이, 톤(비하·결정론 금지), 캐릭터, 공유 카드, 점쳐보기 계산, 라우팅, HTML id·파일 참조, 외부 요청 금지를 검사합니다. (Node.js 필요)

## 수정 방법
| 하고 싶은 일 | 고칠 파일 |
|---|---|
| 문항 추가·수정 | `js/data/questions.js` |
| 유형 설명(직업·연애 등) 수정 | `js/data/types.js` |
| 글자별 생활·직장·연애 팁 수정 | `js/data/letters.js` |
| 유형별 키워드·타일 한 줄 문구 | `js/data/short.js` |
| 점쳐보기 문구·직군 목록·연애 상황 | `js/data/lab.js` |
| 케미·직군 점수 규칙 | `js/match.js` |
| 캐릭터 그림 | `js/avatar.js` |
| 공유 이미지 카드 모양 | `js/share.js` |
| 링크 미리보기 이미지 | `img/og.png` (1200×630) |
| 디자인 | `css/style.css` |
| 채점 방식 | `js/scoring.js` |

프로젝트 규칙은 [CLAUDE.md](CLAUDE.md) 를 참고하세요.

## 배포 (정적 호스팅) — 서버 없이 폴더만 올리면 돼요

### 방법 A. GitHub Pages (무료, 수정할 때마다 갱신하기 편함) — 추천
1. [github.com](https://github.com) 가입/로그인 → **New repository** → 이름 예: `mbti-app` → **Public** → 생성
2. 이 폴더에서 터미널을 열고 (아이디·저장소 이름은 본인 것으로):
   ```
   git init
   git add .
   git commit -m "MBTI 점쳐보기 첫 배포"
   git branch -M main
   git remote add origin https://github.com/<아이디>/<저장소이름>.git
   git push -u origin main
   ```
3. 저장소의 **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root) → Save**
4. 1~2분 뒤 `https://<아이디>.github.io/<저장소이름>/` 로 접속됩니다.
5. 내용을 고친 뒤에는 `git add . && git commit -m "수정" && git push` 만 하면 다시 배포돼요.

### 방법 B. Netlify Drop (가장 빠름, 명령어 없음)
[app.netlify.com/drop](https://app.netlify.com/drop) 에 **폴더를 통째로 끌어다 놓으면** 주소가 바로 생겨요. (계정을 만들어 두면 주소가 유지돼요.)

### 배포 후 할 일
- [ ] 접속해서 **검사 → 결과 → 점쳐보기 → 이미지 저장**까지 한 번 눌러 보기 (휴대폰에서도)
- [ ] **링크 미리보기 이미지**: `index.html` 의 `og:image` 를 **절대 주소**로 바꾸기 — 카카오톡·SNS 크롤러는 상대 경로를 못 읽어요.
  `<meta property="og:image" content="https://<아이디>.github.io/<저장소이름>/img/og.png">`
  (필요하면 `og:url` 도 추가. 이 두 태그의 https 주소는 테스트 규칙에서 허용돼요.)
- [ ] 블로그에 걸 링크: `<배포주소>/#ISTJ`(유형 가이드), `<배포주소>/#lab`(점쳐보기), `<배포주소>/#lab/ENFP/love`(내 유형 지정)
- [ ] 이미지 카드 하단에는 배포 주소가 자동으로 찍혀요 (http(s)로 접속했을 때만)

### 올리기 전에 꼭 확인
- **커밋 이메일이 공개돼요.** 공개 저장소에 올리면 커밋에 적힌 이메일 주소가 누구에게나 보여요. GitHub 의 **Settings → Emails → "Keep my email addresses private"** 를 켜고, `git config user.email "<숫자>+<아이디>@users.noreply.github.com"` 로 바꿔 두세요.
- 올라가는 것은 이 폴더 안의 파일 전부예요. 개인 메모나 비밀번호 같은 파일이 폴더에 없는지 확인하세요. (`tests/`, `*.md` 는 올려도 괜찮고, 빼고 싶으면 `.gitignore` 에 적으세요.)
- 이 앱은 **서버가 없어서** 방문자의 입력·검사 결과가 어디로도 전송되지 않아요. 결과 기록은 방문자 브라우저에만 저장됩니다.
- 앱 이름·글에서 "MBTI®" 를 공식 검사처럼 쓰지 마세요. (화면의 "공식 MBTI® 아님" 고지는 지우지 않기)
