# Google Sheets 데이터베이스 설정 가이드

검사 결과를 Google Sheets에 자동으로 저장하는 방법입니다.

## 1단계: Google Sheets 생성

1. [Google Sheets](https://sheets.google.com)에서 새 스프레드시트 생성
2. 시트 이름을 "검사결과" 또는 원하는 이름으로 변경

## 2단계: 헤더 행 설정

첫 번째 행에 다음 헤더를 입력하세요:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 날짜 | 시간 | 이름 | 성별 | 나이 | 검사종류 | Task Average | Class | 정답률(%) | 응답률(%) | Perfect | Excellent | Good | Fair | Poor | Miss | Early(%) | Late(%) | OnTarget(%) | 표준편차 |

## 3단계: Apps Script 설정

1. Google Sheets 메뉴에서 **확장 프로그램 > Apps Script** 클릭
2. 기본 코드를 모두 삭제하고 아래 코드를 붙여넣기:

```javascript
function doPost(e) {
  try {
    // 현재 활성 스프레드시트와 시트 가져오기
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // POST로 받은 데이터 파싱
    var data = JSON.parse(e.postData.contents);

    // data.results는 배열로, 각 검사 결과가 포함되어 있음
    var results = data.results;

    // 각 검사 결과를 행으로 추가
    results.forEach(function(result) {
      var row = [
        result.date,           // 날짜
        result.time,           // 시간
        result.name,           // 이름
        result.gender,         // 성별
        result.age,            // 나이
        result.testName,       // 검사종류
        result.taskAverage,    // Task Average
        result.classLevel,     // Class
        result.accuracyRate,   // 정답률(%)
        result.responseRate,   // 응답률(%)
        result.perfectCount,   // Perfect
        result.excellentCount, // Excellent
        result.goodCount,      // Good
        result.fairCount,      // Fair
        result.poorCount,      // Poor
        result.missCount,      // Miss
        result.earlyHitPercent,  // Early(%)
        result.lateHitPercent,   // Late(%)
        result.onTargetPercent,  // OnTarget(%)
        result.standardDeviation // 표준편차
      ];

      sheet.appendRow(row);
    });

    return ContentService.createTextOutput(JSON.stringify({
      'status': 'success',
      'message': 'Data added successfully',
      'rowsAdded': results.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Timing Trainer Data Collector is running.');
}
```

3. **저장** 버튼 클릭 (프로젝트 이름은 "Timing Trainer Data Collector"로 설정)

## 4단계: 웹 앱 배포

1. Apps Script 편집기에서 **배포 > 새 배포** 클릭
2. **유형 선택** 옆의 톱니바퀴 아이콘 클릭 → **웹 앱** 선택
3. 다음과 같이 설정:
   - **설명**: "Timing Trainer Data Collection"
   - **다음 계정으로 실행**: "나"
   - **액세스 권한**: "모든 사용자" (중요!)
4. **배포** 클릭
5. **액세스 승인** → Google 계정 선택 → **고급** → **안전하지 않은 페이지로 이동** → **허용**
6. **웹 앱 URL**을 복사해두세요 (예: `https://script.google.com/macros/s/AKfycby.../exec`)

## 5단계: 애플리케이션에 URL 설정

복사한 웹 앱 URL을 애플리케이션에 설정합니다:

### 방법 1: 환경변수 사용 (추천)
프로젝트 루트에 `.env.local` 파일 생성:
```bash
NEXT_PUBLIC_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 방법 2: 직접 코드에 입력
`utils/googleSheetsExport.ts` 파일에서 `GOOGLE_SHEETS_URL` 상수를 수정

## 6단계: 테스트

1. 애플리케이션에서 검사 완료
2. 결과 페이지에서 "Google Sheets에 저장" 버튼 클릭
3. Google Sheets를 새로고침하여 데이터가 추가되었는지 확인

## 문제 해결

### "권한 거부" 오류
- Apps Script 배포 시 "액세스 권한"을 "모든 사용자"로 설정했는지 확인

### 데이터가 저장되지 않음
- 웹 앱 URL이 올바른지 확인
- Google Sheets의 첫 번째 행에 헤더가 있는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 스크립트 수정 후
- 수정할 때마다 **배포 > 배포 관리 > 수정** 버튼을 눌러 새 버전으로 배포해야 합니다

## 데이터 분석 팁

이렇게 쌓인 데이터로 할 수 있는 것들:
- 피벗 테이블로 개인별/검사종류별 평균 계산
- 날짜별 Task Average 추세 그래프
- 검사 종류별 개선율 분석
- Class 분포 차트
