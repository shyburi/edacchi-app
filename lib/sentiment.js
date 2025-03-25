export function analyzeSentimentWithGoogle(text) {
    // 注意: APIキーはクライアント側に記述するのはセキュリティ上好ましくないため、
    // 本番環境ではサーバー経由でリクエストすることを推奨します。
    const apiKey = "AIzaSyCj0ygK26NrrY33-LKRlf5eu3Myh9an0nQ"; // ここにGoogle CloudのAPIキーを設定
    const url = `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${apiKey}`;
    const requestBody = {
      document: {
        type: "PLAIN_TEXT",
        content: text,
      },
      encodingType: "UTF8",
    };
  
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => response.json());
  }
  