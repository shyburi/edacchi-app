// pages/index.js
import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { analyzeSentimentWithGoogle } from '../lib/sentiment';
import ModelViewer from '../components/ModelViewer';
import EmotionCharacter from '../components/EmotionCharacter';

export default function Home() {
  const growthStages = [
    {
      level: 0,
      label: "あかちゃん",
      description: "まだちっちゃくて、ねんねしてるよ",
      prompt: "a baby Groot-like tree branch character, with soft bark and closed wooden eyes, small and fragile, full body, on white background, Pixar style, cinematic lighting"
    },
    {
      level: 1,
      label: "よちよち",
      description: "ちょっとおおきくなって、葉っぱが出てきた！",
      prompt: "a young Groot-like tree branch character, tiny leaves sprouting from sides, big round wooden eyes, happy expression, full body, Pixar style, cinematic lighting, on white background"
    },
    {
      level: 2,
      label: "にこにこ",
      description: "笑ったり、手をふったりできるよ",
      prompt: "a friendly mid-growth tree branch character with bark-textured smile and growing twig arms, expressive eyes, standing upright, full body, white background, CGI rendering"
    },
    {
      level: 3,
      label: "しっかり",
      description: "もうしっかりしてきたね！かっこいい！",
      prompt: "a confident Groot-like wooden branch character, thick bark structure, knot details on arms, cinematic lighting, full body view on white background"
    },
    {
      level: 4,
      label: "ものしり",
      description: "ものしりで、やさしい えだっちになったよ",
      prompt: "an elder tree branch character with moss-covered bark, wise gentle bark eyes, twisting shape, CGI rendering, full body, Pixar style, on white background"
    }
  ];
  

  const [hasStarted, setHasStarted] = useState(false);
  const [transcript, setTranscript] = useState('はなしかけて！');
  const [sentiment, setSentiment] = useState('感情スコア');
  const [sentimentScore, setSentimentScore] = useState(0); // ← ここに追加
  const [gptAnalysis, setGptAnalysis] = useState('');
  const [modelUrl, setModelUrl] = useState(null);
  const [predictionId, setPredictionId] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [growthLevel, setGrowthLevel] = useState(0); // 成長段階
  const [interactionCount, setInteractionCount] = useState(0); // 声かけ回数
  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerating3D, setIsGenerating3D] = useState(false);
  const [zukanEntries, setZukanEntries] = useState([]);
  const [showZukan, setShowZukan] = useState(false);
  const [growthMessage, setGrowthMessage] = useState('');
  const [showGrowthPopup, setShowGrowthPopup] = useState(false);
  const [edacchiReply, setEdacchiReply] = useState('');
  const [showExtraMenu, setShowExtraMenu] = useState(false);








  const toggleRecording = () => {
    if (isRecordingRef.current) {
      recognitionRef.current?.stop();
      isRecordingRef.current = false;
      console.log("録音を停止しました");
  
      handleAnalyzeClick();
      getEdacchiReply(transcript);
    } else {
      setTranscript('');
      setSentiment('感情分析結果を取得中...');
      recognitionRef.current?.start();
      isRecordingRef.current = true;
      console.log("録音を開始しました");
  
      // 🟢 ここで「おはなしボタン押した回数」をカウント＆成長処理
      setInteractionCount(prevCount => {
        const newCount = prevCount + 1;
      
        if (newCount % 3 === 0 && growthLevel < 4) {
          const nextLevel = growthLevel + 1;
          setGrowthLevel(nextLevel);
      
          const labels = ['あかちゃん', 'よちよち', 'にこにこ', 'しっかり', 'ものしり'];
          setGrowthMessage(`🌱 ${labels[nextLevel]}になったよ！`);
          setShowGrowthPopup(true);
          setTimeout(() => setShowGrowthPopup(false), 3000);
        }
        return newCount;
      })
      
    }

  };

    // 🔈ここに追加！
  const speakEdacchi = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.pitch = 1.4;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };
  

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'ja-JP';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event) => {
        let resultTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            resultTranscript += event.results[i][0].transcript;
          }
        }
      
        if (resultTranscript) {
          setTranscript(resultTranscript);
      
          fetch('/api/saveTranscript', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: resultTranscript })
          }).catch(console.error);
      
          analyzeSentimentWithGoogle(resultTranscript)
            .then(result => {
              if (result?.documentSentiment) {
                const score = result.documentSentiment.score;
                setSentiment("感情スコア: " + score);
                setSentimentScore(score);
              } else {
                setSentiment("感情分析の結果が得られませんでした。");
                setSentimentScore(0);
              }
            })
            .catch(() => {
              setSentiment("感情分析エラーが発生しました。");
              setSentimentScore(0);
            });
        }
      };
      

      recognition.onerror = (event) => console.error(event.error);
      recognitionRef.current = recognition;
    }
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!predictionId) return;
    const interval = setInterval(async () => {
      const res = await fetch("/api/checkPredictionStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictionId })
      });
      const data = await res.json();
      if (data.status === "succeeded") {
        const image = data.output[0];
        setImageUrl(image);
        setZukanEntries(prev => [...prev, { imageUrl: image, growthLevel, sentimentScore, transcript, timestamp: Date.now() }]);
        clearInterval(interval);
      } else if (data.status === "failed") {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [predictionId]);

  useEffect(() => {
    if (!gptAnalysis) return;
    const generateImage = async () => {
      const res = await fetch("/api/generateCharacterImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: gptAnalysis })
      });
      const data = await res.json();
      setPredictionId(data.predictionId);
    };
    generateImage();
  }, [gptAnalysis]);

  useEffect(() => {
    if (transcript && hasStarted && !isRecordingRef.current) {
      getEdacchiReply(transcript);
    }
  }, [transcript]);

    // 🔈これをこのあとに追加！
  useEffect(() => {
    if (edacchiReply) {
      speakEdacchi(edacchiReply);
    }
  }, [edacchiReply]);
  

  // const startRecording = (e) => {
  //   e.preventDefault();
  //   if (isRecordingRef.current) return;
  //   isRecordingRef.current = true;
  //   setTranscript('');
  //   setSentiment('感情分析結果を取得中...');
  //   recognitionRef.current?.start();
  // };

  // const stopRecording = (e) => {
  //   e.preventDefault();
  //   if (!isRecordingRef.current) return;
  //   isRecordingRef.current = false;
  //   recognitionRef.current?.stop();
  // };

  const handleAnalyzeClick = async () => {
    try {
      setIsGenerating(true); // ← 開始！
      const growthPrompt = growthStages[growthLevel].prompt;
  
      const res = await fetch('/api/analyzeTranscript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          growthPrompt
        })
      });
  
      const data = await res.json();
      console.log("GPT分析プロンプト:", data.analysis);
      setGptAnalysis(data.analysis);
    } catch (error) {
      console.error("分析エラー:", error);
    } finally {
      setIsGenerating(false); // ← 終了！
    }
  };
  
  // const handleMeshyClick = () => {
  //   fetch('/api/generate3DModel', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ prompt: gptAnalysis }),
  //   })
  //   .then(res => res.json())
  //   .then(async (data) => {
  //     const jobId = data.result;
  //     if (jobId) {
  //       const intervalId = setInterval(async () => {
  //         const statusRes = await fetch('/api/checkModelStatus', {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify({ jobId }),
  //         });
  
  //         const statusData = await statusRes.json();
  
  //         if (statusData.status === 'SUCCEEDED') {
  //           console.log('モデルURL:', statusData.model_urls.glb); // ←ここに追加
  //           setModelUrl(statusData.model_urls.glb);
  //           clearInterval(intervalId);
  //         } else if (statusData.status === 'FAILED') {
  //           alert('モデル生成に失敗しました');
  //           clearInterval(intervalId);
  //         }
  //       }, 5000);
  //     } else {
  //       console.error('Job IDが返されませんでした:', data);
  //     }
  //   })
  //   .catch(console.error);
  // };  

  const handle3DFromImage = async () => {
    if (!imageUrl) {
      alert("画像がありません！");
      return;
    }
  
    setIsGenerating3D(true); // ← 開始！
  
    const res = await fetch('/api/generate3DFromImage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });
  
    const data = await res.json();
    const jobId = data.result;
  
    if (!jobId) {
      alert("Job IDが取得できませんでした");
      setIsGenerating3D(false); // ← 失敗時も終了！
      return;
    }
  
    const intervalId = setInterval(async () => {
      const statusRes = await fetch('/api/checkModelStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
  
      const statusData = await statusRes.json();
  
      if (statusData.status === 'SUCCEEDED') {
        setModelUrl(statusData.model_urls.glb);
        setShowModelModal(true);
        setIsGenerating3D(false); // ← 成功後に終了！
        clearInterval(intervalId);
      } else if (statusData.status === 'FAILED') {
        alert('3Dモデル生成に失敗しました');
        setIsGenerating3D(false); // ← 失敗後にも終了！
        clearInterval(intervalId);
      }
    }, 5000);
  };  
  

  const handleImageGenerate = async () => {
    if (!gptAnalysis) {
      alert("先に文章を分析してください！");
      return;
    }
  
    const res = await fetch("/api/generateCharacterImage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: gptAnalysis  // ← 固定文字列じゃなくGPT分析結果に変更！
      })
    });
  
    const data = await res.json();
    console.log("Prediction ID:", data.predictionId);
    setPredictionId(data.predictionId);
  };

  // 🔁 関数の外に出す
  const getEdacchiReply = async (message) => {
    try {
      const res = await fetch('/api/chatWithEdacchi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: message }),
      });
      const data = await res.json();
      setEdacchiReply(data.reply);
    } catch (err) {
      console.error('えだっちの返事エラー:', err);
      setEdacchiReply('えだっち、ちょっとねむいかも...😴');
    }
  };
  

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '20px', paddingTop: '40px', textAlign: 'center',}}>
      <Head>
        <meta charSet="UTF-8" />
        <title>えだっち</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      {!hasStarted ? (
        <div
          className="initial-start"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh', // 中央寄せ
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#3c3c3c',
            }}
          >
            えだっち
          </h1>

          <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>
            えだっちをうみだそう！
          </h2>

          <button
            className="app-button"
            onClick={() => {
              setHasStarted(true);
              setGrowthLevel(0);
              setInteractionCount(0);
              toggleRecording();
            }}
          >
            声をかけてえだっちをうみだそう！
          </button>
        </div>
      ) : (
        <>
        {/* 通常画面のUIたちをここに全部まとめる！ */}
        {imageUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <div>
              <h3 style={{marginTop: '40px', textAlign: 'center'}}>えだっちのすがた</h3>
              <img
                src={imageUrl}
                alt="Generated Character"
                style={{
                  maxWidth: '300px',
                  width: '80vw',
                  height: 'auto',
                  display: 'block',
                  margin: '0 auto',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          </div>
        )}


        <div id="transcript">{transcript}</div>
        {/* <div id="sentimentResult">{sentiment}</div> */}

        <button
          className="app-button"
          onClick={toggleRecording}
          disabled={isGenerating || isGenerating3D}
          style={{
            opacity: isGenerating || isGenerating3D ? 0.6 : 1,
            cursor: isGenerating || isGenerating3D ? 'not-allowed' : 'pointer',
          }}
        >
          {isRecordingRef.current ? "おはなしをやめる" : "おはなしする"}
        </button>


        {/* 👇 ここに追加！ */}
        <div style={{ height: '24px', marginTop: '10px', textAlign: 'center' }}>
          {isGenerating && (
            <p style={{ fontStyle: 'italic', color: '#555', margin: 0 }}>
              えだっちを考え中...🌿
            </p>
            )}
        </div>

        {/* ▼ トグルボタン */}
        <button
          className="app-button"
          onClick={() => setShowExtraMenu(!showExtraMenu)}
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 1000,
            padding: '8px 12px',
            fontSize: '14px',
            borderRadius: '8px',
          }}
        >
          🔧 えだっちメニュー {showExtraMenu ? '▲' : '▼'}
        </button>


        {/* ▼ 開いたときの中身 */}
        {showExtraMenu && (
          <div
            style={{
              position: 'fixed',
              top: '56px', // ボタンの下に表示
              right: '16px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              zIndex: 999,
            }}
          >
            <button
              className="app-button"
              onClick={handle3DFromImage}
              disabled={isGenerating3D}
              style={{
                opacity: isGenerating3D ? 0.6 : 1,
                cursor: isGenerating3D ? 'not-allowed' : 'pointer'
              }}
            >
              {isGenerating3D ? "リアルにしてるよ…" : "リアルにする！"}
            </button>

            <button
              className="app-button"
              onClick={() => setShowZukan(true)}
            >
              えだっち図鑑を見る📚
            </button>
          </div>
        )}




        {/* <button className="app-button" onClick={handleAnalyzeClick}>えだっちをしんかさせる！</button> */}

        {/* <button
          className="app-button"
          onClick={handle3DFromImage}
          disabled={isGenerating3D}
          style={{
            opacity: isGenerating3D ? 0.6 : 1,
            cursor: isGenerating3D ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating3D ? "リアルにしてるよ…" : "リアルにする！"}
        </button>

        {isGenerating3D && (
          <p aria-live="polite" style={{ marginTop: '10px', fontStyle: 'italic', color: '#555' }}>
            えだっちの3Dモデルをつくってるよ...🌀
          </p>

        )} */}



        {/* <div>えだっちの成長段階: {growthStages[growthLevel].label}</div>
        <p>{growthStages[growthLevel].description}</p> */}

      </>
      )}
      {showModelModal && modelUrl && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '12px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowModelModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ✕
              </button>
              <ModelViewer modelUrl={modelUrl} />

              <a
                href={modelUrl}
                download="edacchi_model.glb"
                style={{
                  display: 'inline-block',
                  marginTop: '16px',
                  padding: '8px 14px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px'
                }}
              >
                ⬇️ モデルをダウンロード
              </a>
          </div>
        </div>
      )}

      {/* <button className="app-button" onClick={() => setShowZukan(true)}>
        えだっち図鑑を見る📚
      </button> */}

      {showZukan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '20px',
            borderRadius: '12px', maxWidth: '90vw', maxHeight: '90vh',
            overflowY: 'auto', position: 'relative'
          }}>
            <button onClick={() => setShowZukan(false)} style={{
              position: 'absolute', top: 10, right: 10,
              background: 'transparent', border: 'none', fontSize: 20
            }}>✕</button>

            <h3 style={{ marginBottom: '16px' }}>えだっち図鑑📚</h3>

            {zukanEntries.length === 0 ? (
              <p>まだ図鑑に登録されていません！</p>
            ) : (
              zukanEntries.map((entry, index) => (
                <div key={index} style={{
                  border: '1px solid #ccc', margin: '10px 0',
                  padding: '10px', borderRadius: '8px'
                }}>
                  <img src={entry.imageUrl} style={{ width: '100px', borderRadius: '8px' }} />
                  <p>🌱 成長段階: {growthStages[entry.growthLevel].label}</p>
                  {/* <p>😊 感情スコア: {entry.sentimentScore}</p> */}
                  <p>🗣️ 声かけ: {entry.transcript}</p>
                  <p>🕒 {new Date(entry.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showGrowthPopup && (
        <div style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#fff',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#3c3c3c',
          animation: 'fadeInOut 3s ease-in-out' // ←ここ大事！
        }}>
          {growthMessage}
        </div>
      )}

      {imageUrl && edacchiReply && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '24px',
          flexWrap: 'wrap'
        }}>
          <img
            src={imageUrl}
            alt="えだっち"
            style={{
              width: '100px',
              height: 'auto',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />

          <div style={{
            position: 'relative',
            backgroundColor: '#f0f9f0',
            border: '1px solid #cdeccc',
            borderRadius: '16px',
            padding: '12px 16px',
            color: '#333',
            fontSize: '16px',
            maxWidth: '60%',
          }}>
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '-10px',
              width: 0,
              height: 0,
              borderTop: '10px solid transparent',
              borderBottom: '10px solid transparent',
              borderRight: '10px solid #f0f9f0',
            }} />
            <strong>えだっち：</strong>{edacchiReply}
          </div>
        </div>
      )}




    </main>
  );
}
