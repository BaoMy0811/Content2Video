// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { 
  Wand2, Clapperboard, Languages, Play, Pause, Image as ImageIcon, 
  Settings, Download, Mic, Type, LayoutTemplate, ArrowRight,
  RefreshCw, CheckCircle2, FileText, Smartphone, Monitor, Palette,
  Zap, Info, AlertTriangle, GripVertical, Plus, Trash2, Maximize2, 
  Minimize2, XCircle, Upload, History, Save, Clock, FilePlus2
} from 'lucide-react';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
//const MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
const TEXT_MODEL = import.meta.env.VITE_GEMINI_TEXT_MODEL || "gemini-2.5-flash";
const IMAGE_MODEL = import.meta.env.VITE_GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview";
const TTS_MODEL = import.meta.env.VITE_GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";


const TONES = [
  { id: 'engaging', label: 'Lôi cuốn & Thu hút' },
  { id: 'humorous', label: 'Hài hước & Vui nhộn' },
  { id: 'dramatic', label: 'Kịch tính & Hồi hộp' },
  { id: 'professional', label: 'Chuyên nghiệp & Thông tin' },
  { id: 'storytelling', label: 'Kể chuyện (Cổ tích/Tiểu thuyết)' }
];

const LANGUAGES = [
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'ja', label: '日本語 (Japanese)' },
  { id: 'ko', label: '한국어 (Korean)' },
  { id: 'zh', label: '中文 (Chinese)' }
];

const VOICES = [
  { id: 'Puck', label: 'Puck (Sôi nổi, Năng động)' },
  { id: 'Kore', label: 'Kore (Mạnh mẽ, Quả quyết)' },
  { id: 'Charon', label: 'Charon (Trầm ấm, Thông tin)' },
  { id: 'Zephyr', label: 'Zephyr (Sáng sủa, Tươi mới)' },
  { id: 'Aoede', label: 'Aoede (Nhẹ nhàng, Thư giãn)' }
];

const ASPECT_RATIOS = [
  { id: '16:9', label: 'YouTube (16:9)', icon: Monitor, width: 1280, height: 720 },
  { id: '9:16', label: 'TikTok/Reels (9:16)', icon: Smartphone, width: 720, height: 1280 },
  { id: '1:1', label: 'Instagram (1:1)', icon: LayoutTemplate, width: 1080, height: 1080 }
];

const IMAGE_STYLES = [
  { 
    id: 'cinematic', label: 'Điện ảnh', 
    suffix: 'Cinematic lighting, hyper-realistic, 8k resolution, highly detailed, photorealistic, dramatic lighting',
    thumbnail: 'https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?w=300&q=80'
  },
  { 
    id: '3d_cartoon', label: 'Hoạt hình 3D', 
    suffix: '3D cartoon style, Pixar animation style, cute, soft lighting, vibrant colors, highly detailed',
    thumbnail: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=300&q=80'
  },
  { 
    id: 'anime', label: 'Anime / Manga', 
    suffix: 'High quality anime style, Studio Ghibli style, detailed background, vibrant colors, beautiful shading',
    thumbnail: 'https://images.unsplash.com/photo-1541562232579-512a21360020?w=300&q=80'
  },
  { 
    id: 'cyberpunk', label: 'Sci-Fi', 
    suffix: 'Cyberpunk style, neon lights, futuristic, sci-fi, dark and moody, high tech',
    thumbnail: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&q=80'
  },
  { 
    id: 'watercolor', label: 'Màu nước', 
    suffix: 'Watercolor painting style, soft edges, artistic, pastel colors, expressive brushstrokes',
    thumbnail: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=300&q=80'
  }
];

const callGeminiText = async (prompt) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const result = await response.json();
  return result.candidates[0].content.parts[0].text;
};

const callGeminiJSON = async (prompt, schema) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: schema }
    })
  });
  const result = await response.json();
  return JSON.parse(result.candidates[0].content.parts[0].text);
};

const callGeminiTTS = async (text, voiceName) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: text }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } } },
      model: "gemini-2.5-flash-preview-tts"
    })
  });
  const result = await response.json();
  const part = result?.candidates?.[0]?.content?.parts?.[0];
  if (part?.inlineData?.data) {
    const mimeType = part.inlineData.mimeType || "";
    const sampleRate = mimeType.match(/rate=(\d+)/) ? parseInt(mimeType.match(/rate=(\d+)/)[1], 10) : 24000;
    const binaryString = atob(part.inlineData.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const pcm16 = new Int16Array(bytes.buffer);
    const wavBuffer = new ArrayBuffer(44 + pcm16.length * 2);
    const view = new DataView(wavBuffer);
    const writeString = (v, offset, str) => { for(let i=0; i<str.length; i++) v.setUint8(offset + i, str.charCodeAt(i)); };
    writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + pcm16.length * 2, true);
    writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt '); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    writeString(view, 36, 'data'); view.setUint32(40, pcm16.length * 2, true);
    for (let i = 0; i < pcm16.length; i++) view.setInt16(44 + i * 2, pcm16[i], true);
    return URL.createObjectURL(new Blob([view], { type: 'audio/wav' }));
  }
  throw new Error("Lỗi Audio");
};

const callGeminiImage = async (prompt, aspectRatioId) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspectRatioId } }
    })
  });
  const result = await response.json();
  const part = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (part) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  throw new Error("Lỗi Image");
};

export default function App() {
  const [step, setStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const cancelProcessRef = useRef(false);
  const [isCancellable, setIsCancellable] = useState(false);
  
  const [sourceText, setSourceText] = useState("");
  const [selectedTone, setSelectedTone] = useState(TONES[0].id);
  const [storyText, setStoryText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].id);
  
  const [scriptData, setScriptData] = useState([]);
  const [sceneAssets, setSceneAssets] = useState({});
  const [activeSceneId, setActiveSceneId] = useState(null);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const fileInputRef = useRef(null);
  const [characterPrompt, setCharacterPrompt] = useState(""); // Thêm state quản lý nhân vật chung
  
  const [historyList, setHistoryList] = useState(() => JSON.parse(localStorage.getItem('content2video_history') || '[]'));
  const [showHistory, setShowHistory] = useState(false);

  const [videoSettings, setVideoSettings] = useState({
    aspectRatio: ASPECT_RATIOS[0].id,
    voice: VOICES[0].id,
    subStyle: 'none', 
    imageStyle: '3d_cartoon',
    showTitleOutroText: false 
  });

  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const audioPlayerRef = useRef(null);
  const [previewActiveWordIndex, setPreviewActiveWordIndex] = useState(-1);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false); 
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const subtitleIntervalRef = useRef(null);

  useEffect(() => {
      return () => { if (subtitleIntervalRef.current) clearInterval(subtitleIntervalRef.current); };
  }, []);

  useEffect(() => {
      if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
          audioPlayerRef.current.currentTime = 0;
          setIsPlayingPreview(false);
      }
      setPreviewActiveWordIndex(-1);
  }, [activeSceneId]);

  const showError = (msg) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 5000);
  };

  const handleSaveHistory = () => {
    if (scriptData.length === 0) return;
    const title = scriptData[0]?.narration || `Video ${new Date().toLocaleString()}`;
    const newItem = { id: Date.now(), title, scriptData, characterPrompt, date: new Date().toLocaleString() };
    const newHistory = [newItem, ...historyList].slice(0, 20); 
    setHistoryList(newHistory);
    localStorage.setItem('content2video_history', JSON.stringify(newHistory));
    showError("✅ Đã lưu kịch bản vào Lịch sử!");
  };

  const handleLoadHistory = (item) => {
    setScriptData(item.scriptData);
    setCharacterPrompt(item.characterPrompt || "");
    const initialAssets = {};
    item.scriptData.forEach(scene => {
       initialAssets[scene.id] = { audioUrl: null, imageUrl: null, isLoadingAudio: false, isLoadingImage: false };
    });
    setSceneAssets(initialAssets);
    setActiveSceneId(item.scriptData[0].id);
    setStep(3);
    setMaxStepReached(Math.max(maxStepReached, 3));
    setShowHistory(false);
    showError("✅ Đã mở kịch bản từ Lịch sử!");
  };

  const handleDeleteHistory = (id) => {
      const newHistory = historyList.filter(h => h.id !== id);
      setHistoryList(newHistory);
      localStorage.setItem('content2video_history', JSON.stringify(newHistory));
  };

  const handleNewVideo = () => {
      handleSaveHistory(); 
      setSourceText("");
      setStoryText("");
      setScriptData([]);
      setSceneAssets({});
      setActiveSceneId(null);
      setCharacterPrompt("");
      setStep(1);
      setMaxStepReached(1);
      setRenderProgress(0);
      showError("✨ Đã tạo trang dự án mới!");
  };

  const handleRewrite = async () => {
    if (!sourceText.trim()) return;
    setLoadingMsg("Đang dùng AI để viết lại nội dung...");
    try {
      const prompt = `Viết lại nội dung sau đây thành một câu chuyện hoàn chỉnh. Văn phong: ${TONES.find(t => t.id === selectedTone).label}. Giữ ý chính nhưng hấp dẫn hơn.\n\n${sourceText}`;
      const result = await callGeminiText(prompt);
      setStoryText(result);
      setStep(2);
      setMaxStepReached(Math.max(maxStepReached, 2));
    } catch (error) { showError("Đã xảy ra lỗi kết nối AI. Vui lòng thử lại."); } finally { setLoadingMsg(""); }
  };

  const handleTranslate = async () => {
    if (!storyText.trim()) return;
    setLoadingMsg(`Đang dịch...`);
    try {
      const prompt = `Dịch toàn bộ đoạn văn bản sau sang: ${LANGUAGES.find(l => l.id === selectedLanguage).label}. Chỉ trả về nội dung dịch.\n\n${storyText}`;
      const result = await callGeminiText(prompt);
      setStoryText(result);
    } catch (error) { showError("Lỗi Dịch thuật"); } finally { setLoadingMsg(""); }
  };

  const handleCreateScript = async () => {
    setLoadingMsg("Đang phân tích thành Kịch bản Video (Không tóm tắt)...");
    try {
      const schema = {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          mainCharacterDescription: { type: "STRING", description: "Mô tả nhân vật chính bằng TIẾNG ANH thật chi tiết: giới tính, độ tuổi, màu tóc, kiểu tóc, CÓ RÂU HAY KHÔNG, quần áo, màu sắc trang phục." },
          scenes: {
            type: "ARRAY", items: {
              type: "OBJECT", properties: {
                id: { type: "NUMBER" }, visual: { type: "STRING", description: "Mô tả bối cảnh và hành động (chỉ bối cảnh, không lặp lại mô tả nhân vật)" }, narration: { type: "STRING" }
              }, required: ["id", "visual", "narration"]
            }
          }
        }, required: ["title", "mainCharacterDescription", "scenes"]
      };
      
      const prompt = `Bạn là một biên kịch video. Hãy chuyển ĐẦY ĐỦ bản thảo sau thành kịch bản chi tiết.
YÊU CẦU TỐI QUAN TRỌNG:
1. TUYỆT ĐỐI KHÔNG ĐƯỢC TÓM TẮT HAY CẮT BỚT. Phải giữ trọn vẹn toàn bộ ý nghĩa và câu chữ của bản thảo gốc.
2. Chia nhỏ toàn bộ bản thảo thành NHIỀU phân cảnh (scenes) liên tiếp nhau để video đủ dài. Mỗi cảnh chứa khoảng 1 đến 3 câu thoại.
3. Phần 'narration' (lời thoại) của tất cả các phân cảnh khi ghép lại phải khớp ĐẦY ĐỦ 100% với nội dung bản thảo gốc, không sót chữ nào.
4. Phần 'visual' chỉ mô tả bối cảnh và hành động của nhân vật bằng TIẾNG ANH.
5. Cung cấp 1 'title' (tựa đề) và 1 'mainCharacterDescription' (mô tả nhân vật chính bằng tiếng Anh thật chi tiết để làm Prompt khoá hình ảnh nhân vật).

Bản thảo gốc:
${storyText}`;
      const result = await callGeminiJSON(prompt, schema);
      
      let videoTitle = result.title || "Video Story";
      let characterDesc = result.mainCharacterDescription || "";
      let parsedScenes = result.scenes || [];

      setCharacterPrompt(characterDesc);

      const titleScene = {
          id: Date.now(),
          visual: `Epic wide shot, beautiful environment, highly detailed background. No text in the image.`,
          narration: videoTitle,
          isTitle: true
      };

      setLoadingMsg("Đang tạo cảnh kết thúc (Outro)...");
      const outroPrompt = `Viết 1 câu kết thúc video cảm ơn khán giả đã xem, kêu gọi Like và Subscribe. Bắt buộc viết bằng ngôn ngữ này: ${LANGUAGES.find(l => l.id === selectedLanguage).label}. Chỉ trả về duy nhất 1 câu thoại đó.`;
      const outroNarration = await callGeminiText(outroPrompt);
      const outroScene = {
          id: Date.now() + 999,
          visual: `Characters looking happy and welcoming. Warm and aesthetic environment. No text in the image.`,
          narration: outroNarration.replace(/["']/g, ''),
          isOutro: true
      };

      const fullScriptData = [titleScene, ...parsedScenes, outroScene];
      setScriptData(fullScriptData);
      
      const initialAssets = {};
      fullScriptData.forEach(scene => {
        initialAssets[scene.id] = { audioUrl: null, imageUrl: null, isLoadingAudio: false, isLoadingImage: false };
      });
      setSceneAssets(initialAssets);
      if (fullScriptData.length > 0) setActiveSceneId(fullScriptData[0].id);
      
      setStep(3);
      setMaxStepReached(Math.max(maxStepReached, 3));
    } catch (error) { 
      showError("Lỗi khi tạo kịch bản, vui lòng thử lại.");
    } finally { setLoadingMsg(""); }
  };

  const handleImportScript = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const parsed = JSON.parse(evt.target.result);
            if (Array.isArray(parsed) && parsed.length > 0) {
                setScriptData(parsed);
                const initialAssets = {};
                parsed.forEach(scene => {
                   initialAssets[scene.id] = { audioUrl: null, imageUrl: null, isLoadingAudio: false, isLoadingImage: false };
                });
                setSceneAssets(initialAssets);
                setActiveSceneId(parsed[0].id);
                setStep(3);
                setMaxStepReached(Math.max(maxStepReached, 4)); // Mở khoá thẳng đến bước 4
                showError("✅ Đã import kịch bản thành công!");
            } else {
                showError("File JSON không chứa dữ liệu kịch bản hợp lệ.");
            }
        } catch(err) {
            showError("Lỗi đọc file JSON.");
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleExportScript = () => {
    if (scriptData.length === 0) return;
    const blob = new Blob([JSON.stringify(scriptData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Script_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateSceneContent = (sceneId, field, value) => {
      setScriptData(prev => prev.map(s => s.id === sceneId ? { ...s, [field]: value } : s));
      if (field === 'narration') {
          setSceneAssets(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], audioUrl: null }}));
      }
      if (field === 'visual') {
          setSceneAssets(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], imageUrl: null }}));
      }
  };

  const deleteScene = (sceneId) => {
      setScriptData(prev => prev.filter(s => s.id !== sceneId));
  };

  const handleDragStart = (e, index) => {
      setDraggedIdx(index);
      e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e, index) => { e.preventDefault(); };
  const handleDrop = (e, targetIdx) => {
      e.preventDefault();
      if (draggedIdx === null || draggedIdx === targetIdx) return;
      if (targetIdx === 0 || targetIdx === scriptData.length - 1 || draggedIdx === 0 || draggedIdx === scriptData.length - 1) return;

      const newScript = [...scriptData];
      const [movedScene] = newScript.splice(draggedIdx, 1);
      newScript.splice(targetIdx, 0, movedScene);
      setScriptData(newScript);
      setDraggedIdx(null);
  };

  const handleInsertSceneAI = async (insertIndex) => {
      const prevScene = scriptData[insertIndex - 1];
      const nextScene = scriptData[insertIndex];
      setLoadingMsg("AI đang tính toán cảnh nối tiếp logic...");

      try {
          const schema = {
             type: "OBJECT", properties: {
                 visual: { type: "STRING" }, narration: { type: "STRING" }
             }, required: ["visual", "narration"]
          };
          const prompt = `Tôi có phân cảnh phía trước là: Lời thoại: "${prevScene?.narration || ''}", Hình ảnh: "${prevScene?.visual || ''}". 
          Và phân cảnh phía sau là: Lời thoại: "${nextScene?.narration || ''}", Hình ảnh: "${nextScene?.visual || ''}".
          Hãy nghĩ ra 1 phân cảnh nối tiếp mượt mà chèn vào GIỮA 2 cảnh này. Giữ đúng ngôn ngữ đang dùng. 'visual' (tiếng Anh) và 'narration'.`;
          
          const result = await callGeminiJSON(prompt, schema);
          const newId = Date.now();
          const newScene = { id: newId, visual: result.visual, narration: result.narration };
          
          const newScript = [...scriptData];
          newScript.splice(insertIndex, 0, newScene);
          setScriptData(newScript);
          setSceneAssets(prev => ({ ...prev, [newId]: { audioUrl: null, imageUrl: null, isLoadingAudio: false, isLoadingImage: false } }));
      } catch (err) {
          showError("Lỗi chèn cảnh AI.");
      } finally { setLoadingMsg(""); }
  };

  const handleSettingsChange = (field, value) => {
      setVideoSettings(prev => ({ ...prev, [field]: value }));
      if (field === 'voice') {
          const resetAudio = {};
          scriptData.forEach(s => resetAudio[s.id] = { ...sceneAssets[s.id], audioUrl: null });
          setSceneAssets(resetAudio);
          showError("Đã đổi Giọng đọc. Vui lòng Bấm Tạo lại Tất Cả Audio!");
      }
      if (field === 'imageStyle') {
          const resetImg = {};
          scriptData.forEach(s => resetImg[s.id] = { ...sceneAssets[s.id], imageUrl: null });
          setSceneAssets(resetImg);
          showError("Đã đổi Style Hình ảnh. Vui lòng Bấm Tạo lại Tất Cả Ảnh!");
      }
  };

  const generateSceneAudio = async (sceneId, text) => {
    setSceneAssets(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], isLoadingAudio: true } }));
    try {
      const audioUrl = await callGeminiTTS(text, videoSettings.voice);
      setSceneAssets(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], audioUrl, isLoadingAudio: false } }));
    } catch (error) {
      setSceneAssets(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], isLoadingAudio: false } }));
      showError(`Lỗi tạo Audio cảnh ${sceneId}`);
    }
  };

  const generateSceneImage = async (sceneId, visualPrompt) => {
    setSceneAssets(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], isLoadingImage: true } }));
    try {
      const style = IMAGE_STYLES.find(s => s.id === videoSettings.imageStyle);
      const optimizedPrompt = `[SUBJECT: ${characterPrompt}]. [ACTION & SCENE: ${visualPrompt}]. [ART STYLE: ${style.suffix}]. RULE: Maintain the EXACT SAME SUBJECT (face, hair color, facial hair, clothing) across all generations.`;
      const imageUrl = await callGeminiImage(optimizedPrompt, videoSettings.aspectRatio);
      setSceneAssets(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], imageUrl, isLoadingImage: false } }));
    } catch (error) {
      setSceneAssets(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], isLoadingImage: false } }));
      showError(`Lỗi tạo Ảnh cảnh ${sceneId}`);
    }
  };

  const handleBatchGenerate = async (forceRecreate = false) => {
    cancelProcessRef.current = false;
    setIsCancellable(true);
    
    for (let i = 0; i < scriptData.length; i++) {
      if (cancelProcessRef.current) break; 
      
      const scene = scriptData[i];
      setActiveSceneId(scene.id);
      const assets = sceneAssets[scene.id] || {};
      
      if (forceRecreate || !assets.imageUrl) {
        setLoadingMsg(`Đang tạo Ảnh cho Cảnh ${i + 1}/${scriptData.length}...`);
        await generateSceneImage(scene.id, scene.visual);
      }
      
      if (cancelProcessRef.current) break;
      
      if (forceRecreate || !assets.audioUrl) {
        setLoadingMsg(`Đang tạo Audio cho Cảnh ${i + 1}/${scriptData.length}...`);
        await generateSceneAudio(scene.id, scene.narration);
      }
    }
    
    setIsCancellable(false);
    setLoadingMsg("");
    if (cancelProcessRef.current) showError("Đã dừng tiến trình AI.");
  };

  const renderSubtitles = (ctx, words, activeIndex, centerX, centerY, maxWidth, style, fontSize = 36, lineHeight = 45) => {
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    let lines = []; let currentLine = []; let currentWidth = 0;
    const spaceWidth = ctx.measureText(" ").width;

    words.forEach((w, i) => {
        const wWidth = ctx.measureText(w).width;
        if (currentWidth + wWidth > maxWidth && currentLine.length > 0) {
            lines.push(currentLine); currentLine = [{word: w, index: i, width: wWidth}]; currentWidth = wWidth + spaceWidth;
        } else {
            currentLine.push({word: w, index: i, width: wWidth}); currentWidth += wWidth + spaceWidth;
        }
    });
    if (currentLine.length > 0) lines.push(currentLine);

    let startY = centerY - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
        const lineWidth = line.reduce((sum, w) => sum + w.width + spaceWidth, 0) - spaceWidth;
        let startX = centerX - lineWidth / 2;
        let y = startY + i * lineHeight;

        line.forEach(w => {
            if (style === 'title') ctx.fillStyle = '#facc15';
            else if (style === 'dynamic') ctx.fillStyle = w.index <= activeIndex ? '#facc15' : 'white';
            else ctx.fillStyle = 'white';
            ctx.fillText(w.word, startX, y);
            startX += w.width + spaceWidth;
        });
    });
  };

  const handleExportSRT = async () => {
    const missingAssets = scriptData.some(s => !sceneAssets[s.id]?.audioUrl);
    if (missingAssets) {
      showError("⚠️ Bạn cần tạo đầy đủ Audio cho tất cả các phân cảnh trước khi xuất phụ đề!");
      return;
    }

    setLoadingMsg("Đang tạo file phụ đề (.srt)...");
    try {
      let srtContent = "";
      let srtIndex = 1;
      let globalTimeMs = 0;

      const formatSRTTime = (ms) => {
        const totalSecs = Math.floor(ms / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;
        const milliseconds = Math.floor(ms % 1000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
      };

      const getAudioDuration = (url) => new Promise((resolve) => {
          const audio = new Audio(url);
          audio.addEventListener('loadedmetadata', () => { if (audio.duration !== Infinity && !isNaN(audio.duration)) resolve(audio.duration); });
          audio.addEventListener('error', () => resolve(2)); 
          audio.load();
      });

      for (let i = 0; i < scriptData.length; i++) {
        const scene = scriptData[i];
        const audioUrl = sceneAssets[scene.id].audioUrl;
        const isLastScene = i === scriptData.length - 1;
        const delayMs = isLastScene ? 4000 : 300; 

        const durationSec = await getAudioDuration(audioUrl);
        const durationMs = durationSec * 1000;
        
        // Công thức Linear nhưng khử khoảng lặng 350ms cuối
        const effectiveDurationMs = Math.max(durationMs * 0.85, durationMs - 350);
        const words = scene.narration.split(/\s+/).filter(Boolean);

        if (words.length > 0) {
            const avgWordDuration = effectiveDurationMs / words.length;
            const CHUNK_SIZE = 8; 
            let chunkStartMs = globalTimeMs;

            for (let j = 0; j < words.length; j += CHUNK_SIZE) {
                const chunkWords = words.slice(j, j + CHUNK_SIZE);
                const chunkDuration = chunkWords.length * avgWordDuration;
                const chunkEndMs = chunkStartMs + chunkDuration;

                srtContent += `${srtIndex}\n${formatSRTTime(chunkStartMs)} --> ${formatSRTTime(chunkEndMs)}\n${chunkWords.join(" ")}\n\n`;
                srtIndex++;
                chunkStartMs = chunkEndMs;
            }
        }
        globalTimeMs += durationMs + delayMs;
      }

      const blob = new Blob([srtContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Content2Video_Subtitle_${Date.now()}.srt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showError("Lỗi khi tạo file SRT.");
    } finally { setLoadingMsg(""); }
  };

  const handleExportVideo = async () => {
    const missingAssets = scriptData.some(s => !sceneAssets[s.id]?.imageUrl || !sceneAssets[s.id]?.audioUrl);
    if (missingAssets) {
      showError("⚠️ Bạn cần tạo đầy đủ Ảnh và Audio cho tất cả các phân cảnh trước khi xuất video!");
      return;
    }

    cancelProcessRef.current = false;
    const fileName = `Content2Video_${Date.now()}.webm`;
    setIsRendering(true);
    setRenderProgress(0);

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      // BƯỚC 1: PRELOAD - Nạp thẳng 100% Ảnh & Audio vào RAM để chống Desync khi Render
      setLoadingMsg("Đang tải dữ liệu (Tải Hình ảnh & Giải mã Audio)...");
      const preloadedScenes = [];
      for (let i = 0; i < scriptData.length; i++) {
          if (cancelProcessRef.current) break;
          setRenderProgress(Math.round((i / scriptData.length) * 40)); 
          const scene = scriptData[i];
          const assets = sceneAssets[scene.id];

          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise(res => { img.onload = res; img.src = assets.imageUrl; });
          
          const audioResponse = await fetch(assets.audioUrl);
          const arrayBuffer = await audioResponse.arrayBuffer();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          
          preloadedScenes.push({
              scene, img, audioBuffer, words: scene.narration.split(/\s+/).filter(Boolean)
          });
      }

      if (cancelProcessRef.current) {
          setIsRendering(false); setLoadingMsg(""); showError("Đã huỷ xuất Video."); return;
      }

      // BƯỚC 2: RENDER LOOP (Tuyệt đối không bị gián đoạn mạng)
      setLoadingMsg("Đang Render khung hình (Vui lòng không đóng tab)...");
      const ratio = ASPECT_RATIOS.find(r => r.id === videoSettings.aspectRatio);
      const canvas = document.createElement('canvas');
      canvas.width = ratio.width; canvas.height = ratio.height;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(30);
      const dest = audioCtx.createMediaStreamDestination();
      stream.addTrack(dest.stream.getAudioTracks()[0]);

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      
      const recordingPromise = new Promise(resolve => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      });

      recorder.start();
      
      // Đồng hồ tuyệt đối của Audio Hardware
      let currentSceneStartTime = audioCtx.currentTime + 0.1; 

      for (let i = 0; i < preloadedScenes.length; i++) {
        if (cancelProcessRef.current) break;

        const { scene, img, audioBuffer, words } = preloadedScenes[i];
        const isLastScene = i === preloadedScenes.length - 1;
        setRenderProgress(40 + Math.round((i / preloadedScenes.length) * 60));

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(dest);
        source.start(currentSceneStartTime); // Lên lịch phát chính xác từng mili-giây
        
        const durationMs = audioBuffer.duration * 1000;
        const delayNeededMs = isLastScene ? 4000 : 300;
        
        // Khử khoảng lặng 350ms ở đuôi file âm thanh để phụ đề bắt kịp chính xác lời nói cuối
        const effectiveDurationMs = Math.max(durationMs * 0.85, durationMs - 350);
        const avgWordDuration = words.length > 0 ? (effectiveDurationMs / words.length) : effectiveDurationMs;
        
        await new Promise(res => {
            // Dùng SetInterval thay vì RequestAnimationFrame để tab ẩn vẫn render được
            const intervalId = setInterval(() => {
                if (cancelProcessRef.current) {
                    clearInterval(intervalId);
                    try { source.stop(); } catch(e){}
                    return res();
                }

                const now = audioCtx.currentTime;
                let sceneElapsedMs = (now - currentSceneStartTime) * 1000;
                if (sceneElapsedMs < 0) sceneElapsedMs = 0;
                
                // VẼ KHUNG HÌNH MỚI
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width / 2) - (img.width / 2) * scale;
                const y = (canvas.height / 2) - (img.height / 2) * scale;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                if (scene.isTitle || scene.isOutro) {
                    if (videoSettings.showTitleOutroText) {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.shadowColor = 'black'; ctx.shadowBlur = 15; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;
                        renderSubtitles(ctx, words, words.length, canvas.width / 2, canvas.height / 2, canvas.width - 100, 'title', 55, 65);
                    }
                } else if (videoSettings.subStyle !== 'none' && words.length > 0) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                    ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
                    ctx.shadowColor = 'black'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;

                    // Tính Word Index bằng Linear Equation nhưng với EffectiveDuration
                    const currentWordIndex = Math.max(0, Math.min(words.length - 1, Math.floor(sceneElapsedMs / avgWordDuration)));
                    renderSubtitles(ctx, words, currentWordIndex, canvas.width / 2, canvas.height - 75, canvas.width - 60, videoSettings.subStyle, 36, 45);
                }

                // Kết thúc cảnh hiện tại khi đạt đủ thời gian + độ trễ
                if (sceneElapsedMs >= durationMs + delayNeededMs) {
                    clearInterval(intervalId);
                    res();
                }
            }, 1000 / 30);
        });

        currentSceneStartTime += (durationMs + delayNeededMs) / 1000;
      }

      if (cancelProcessRef.current) {
          recorder.stop();
          setIsRendering(false); setLoadingMsg("");
          showError("Đã huỷ xuất Video.");
          return;
      }

      setRenderProgress(100);
      handleSaveHistory(); 
      
      // Chốt buffer: Xả các khung hình cuối cùng 
      await new Promise(resolve => {
          let ticks = 0;
          const flushInterval = setInterval(() => {
              ctx.fillStyle = `rgba(0,0,0,${ticks % 2 === 0 ? 0.01 : 0.02})`;
              ctx.fillRect(0, 0, 1, 1);
              ticks++;
              if (ticks > 20) { clearInterval(flushInterval); resolve(); }
          }, 100);
      });

      recorder.stop();
      const videoBlob = await recordingPromise;
      
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      showError("Lỗi Render video. Trình duyệt có thể đã chặn hoặc thiếu tài nguyên bộ nhớ.");
    } finally { setIsRendering(false); setLoadingMsg(""); }
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 flex items-center justify-between text-white">
          <span className="flex items-center"><FileText className="w-5 h-5 mr-2 text-blue-400" /> Nhập Nội dung / Transcript</span>
          
          <div>
            <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleImportScript} />
            <button onClick={() => fileInputRef.current.click()} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center shadow-lg transition-colors">
               <Upload className="w-4 h-4 mr-2" /> Nhập Kịch bản (.json)
            </button>
          </div>
        </h2>
        
        <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Dán nội dung hoặc transcript từ YouTube vào đây..."
          className="w-full h-64 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 resize-none" />
        
        <div className="mt-6 flex justify-between gap-4">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-slate-300">Văn phong:</label>
            <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value)} className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2.5">
              {TONES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <button onClick={handleRewrite} disabled={!sourceText.trim() || !!loadingMsg} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white rounded-xl shadow-lg flex items-center disabled:opacity-50">
            <Wand2 className="w-4 h-4 mr-2" /> Viết lại
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold flex text-white"><LayoutTemplate className="w-5 h-5 mr-2 text-indigo-400" /> Bản Thảo</h2>
          <div className="flex bg-slate-900 p-1.5 rounded-lg border border-slate-700">
            <Languages className="w-4 h-4 text-slate-400 m-1" />
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-transparent text-white text-sm outline-none">
              {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <button onClick={handleTranslate} className="ml-2 px-3 py-1 bg-slate-700 text-xs rounded text-white">Dịch</button>
          </div>
        </div>
        <textarea value={storyText} onChange={(e) => setStoryText(e.target.value)} className="w-full h-80 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 resize-none leading-relaxed" />
        <div className="mt-6 flex justify-between">
          <button onClick={() => setStep(1)} className="text-slate-400">Quay lại</button>
          <button onClick={handleCreateScript} disabled={!!loadingMsg} className="px-6 py-3 bg-indigo-600 text-white rounded-xl flex items-center"><Clapperboard className="w-4 h-4 mr-2" /> Tạo Kịch bản</button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex-wrap gap-4">
        <h2 className="text-xl font-semibold flex items-center text-white">
            <Clapperboard className="w-5 h-5 mr-2 text-purple-400" /> Kịch bản ({scriptData.length} cảnh)
        </h2>
        <div className="flex items-center flex-wrap gap-2">
            <button onClick={handleSaveHistory} className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg flex items-center text-sm font-medium shadow-lg">
                <Save className="w-4 h-4 mr-2" /> Lưu Lịch sử
            </button>
            <button onClick={handleExportScript} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center text-sm font-medium transition-colors shadow-lg">
                <Download className="w-4 h-4 mr-2" /> Xuất JSON
            </button>
            <button onClick={() => { setStep(4); setMaxStepReached(Math.max(maxStepReached, 4)); }} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg flex items-center shadow-lg">
              Đến Video Studio <ArrowRight className="w-4 h-4 ml-2" />
            </button>
        </div>
      </div>

      <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 shadow-md">
        <label className="text-sm font-bold text-pink-400 uppercase mb-2 flex items-center">
            <ImageIcon className="w-4 h-4 mr-2" /> Đặc điểm Nhân vật chính (Global Character Prompt)
        </label>
        <p className="text-xs text-slate-400 mb-3">Thông tin này sẽ được gắn vào TẤT CẢ các bức ảnh (kể cả Tiêu đề & Outro) để ép AI vẽ đồng nhất khuôn mặt, màu tóc, quần áo. Bạn có thể sửa tiếng Anh ở đây.</p>
        <textarea 
            value={characterPrompt} 
            onChange={(e) => setCharacterPrompt(e.target.value)} 
            className="w-full bg-slate-900 p-3 rounded-lg text-slate-200 text-sm border border-slate-700 resize-none h-20 focus:ring-1 focus:ring-pink-500" 
            placeholder="Ví dụ: A 25 year old man, short black hair, no beard, wearing a red hoodie and blue jeans..." 
        />
      </div>

      <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {scriptData.map((scene, idx) => (
          <React.Fragment key={scene.id}>
            {idx > 0 && (
              <div className="relative h-6 group">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                   <button onClick={() => handleInsertSceneAI(idx)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded-full flex items-center shadow-lg"><Plus className="w-3 h-3 mr-1"/> Chèn cảnh vào đây (AI)</button>
                </div>
                <div className="w-full h-[1px] bg-slate-800 group-hover:bg-blue-500/50 absolute top-1/2 mt-[-0.5px]"></div>
              </div>
            )}
            
            <div 
              draggable={!scene.isTitle && !scene.isOutro}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              className={`p-4 rounded-xl border flex gap-4 transition-all relative
                ${scene.isTitle || scene.isOutro ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}
                ${draggedIdx === idx ? 'opacity-50 scale-95' : 'opacity-100'}`}
            >
              {!scene.isTitle && !scene.isOutro && (
                  <div className="flex items-center justify-center cursor-grab text-slate-500 hover:text-white"><GripVertical className="w-5 h-5" /></div>
              )}
              
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-xs font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded">
                      {scene.isTitle ? 'TITLE (Bắt đầu)' : scene.isOutro ? 'OUTRO (Kết thúc)' : `Cảnh ${idx}`}
                   </span>
                   {!scene.isTitle && !scene.isOutro && (
                      <button onClick={() => deleteScene(scene.id)} className="text-red-400 hover:text-red-300 p-1 bg-red-400/10 rounded"><Trash2 className="w-4 h-4"/></button>
                   )}
                </div>
                <textarea value={scene.visual} onChange={(e) => updateSceneContent(scene.id, 'visual', e.target.value)} className="w-full bg-slate-900 p-2 rounded text-slate-300 text-sm border border-slate-700 resize-none h-16 focus:ring-1 focus:ring-blue-500" placeholder="Mô tả hình ảnh (Tiếng Anh)..." />
                <textarea value={scene.narration} onChange={(e) => updateSceneContent(scene.id, 'narration', e.target.value)} className="w-full bg-slate-900 p-2 rounded text-slate-200 text-sm border border-slate-700 resize-none h-20 focus:ring-1 focus:ring-blue-500" placeholder="Lời thoại..." />
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => {
    const selectedAspectRatioObj = ASPECT_RATIOS.find(r => r.id === videoSettings.aspectRatio);
    const mockVideoWidth = isPreviewExpanded ? (window.innerWidth * 0.7) : 350; 
    const ratioMultiplier = selectedAspectRatioObj.height / selectedAspectRatioObj.width;
    const mockVideoHeight = isPreviewExpanded ? (mockVideoWidth * ratioMultiplier) : (mockVideoWidth * ratioMultiplier);

    const activeSceneData = scriptData.find(s => s.id === activeSceneId) || scriptData[0];
    const activeAssets = sceneAssets[activeSceneId] || {};

    const togglePlayReview = () => {
      const audio = audioPlayerRef.current;
      if (!audio || !activeAssets?.audioUrl) return;

      if (isPlayingPreview) {
          audio.pause();
      } else {
          if (audio.src !== activeAssets.audioUrl) audio.src = activeAssets.audioUrl;
          
          audio.play().then(() => {
              if (videoSettings.subStyle !== 'none') {
                  const words = activeSceneData.narration.split(/\s+/).filter(Boolean);
                  if (subtitleIntervalRef.current) clearInterval(subtitleIntervalRef.current);
                  
                  subtitleIntervalRef.current = setInterval(() => {
                      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity && words.length > 0) {
                          const durationMs = audio.duration * 1000;
                          const effectiveDurationMs = Math.max(durationMs * 0.85, durationMs - 350);
                          const avgWordDuration = effectiveDurationMs / words.length;
                          const currentTimeMs = audio.currentTime * 1000;
                          const activeIdx = Math.max(0, Math.min(words.length - 1, Math.floor(currentTimeMs / avgWordDuration)));
                          setPreviewActiveWordIndex(activeIdx);
                      }
                  }, 50); 
              }
          }).catch(() => showError("Bấm Play để nghe."));
      }
    };

    const previewWordsArray = activeSceneData?.narration.split(/\s+/).filter(Boolean) || [];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 relative">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <label className="text-base text-white font-semibold flex items-center mb-4"><Palette className="w-5 h-5 mr-2 text-pink-400" /> Chọn Phong cách</label>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {IMAGE_STYLES.map(style => (
              <button key={style.id} onClick={() => handleSettingsChange('imageStyle', style.id)}
                className={`relative flex-shrink-0 w-40 h-28 rounded-xl overflow-hidden border-2 transition-all ${videoSettings.imageStyle === style.id ? 'border-blue-500 scale-105' : 'border-slate-700'}`}>
                <img src={style.thumbnail} alt={style.label} className="w-full h-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent flex items-end p-3"><span className="text-sm font-medium text-white">{style.label}</span></div>
                {videoSettings.imageStyle === style.id && <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-0.5"><CheckCircle2 className="w-4 h-4 text-white" /></div>}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-wrap gap-6 items-end">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Tỷ lệ</label>
            <div className="flex space-x-2">
              {ASPECT_RATIOS.map(ar => {
                const Icon = ar.icon;
                return (
                  <button key={ar.id} onClick={() => handleSettingsChange('aspectRatio', ar.id)}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-sm ${videoSettings.aspectRatio === ar.id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                    <Icon className="w-4 h-4 mr-1.5" /> {ar.id}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Giọng đọc</label>
            <select value={videoSettings.voice} onChange={(e) => handleSettingsChange('voice', e.target.value)} className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2">
              {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Style Phụ đề</label>
            <select value={videoSettings.subStyle} onChange={(e) => handleSettingsChange('subStyle', e.target.value)} className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2">
              <option value="classic">Cơ bản (Trắng)</option><option value="dynamic">Karaoke (Vàng)</option><option value="none">Ẩn phụ đề</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Chữ Mở/Kết</label>
            <select value={videoSettings.showTitleOutroText ? 'true' : 'false'} onChange={(e) => handleSettingsChange('showTitleOutroText', e.target.value === 'true')} className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2">
              <option value="true">Hiển thị</option><option value="false">Ẩn đi</option>
            </select>
          </div>
          <div className="ml-auto flex items-center space-x-2">
             <button onClick={handleExportScript} disabled={isRendering} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold flex"><Download className="w-5 h-5 mr-2" /> JSON</button>
             <button onClick={handleExportSRT} disabled={isRendering} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex"><FileText className="w-5 h-5 mr-2" /> SRT</button>
             <button onClick={handleExportVideo} disabled={isRendering} className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex"><Download className="w-5 h-5 mr-2" /> Xuất Video</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-slate-400 uppercase">Danh sách ({scriptData.length})</h3>
                <div className="flex space-x-2">
                  <button onClick={() => handleBatchGenerate(false)} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm flex"><Zap className="w-4 h-4 mr-2" /> Tạo phần thiếu</button>
                  <button onClick={() => handleBatchGenerate(true)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex"><RefreshCw className="w-4 h-4 mr-2" /> Tạo LẠI tất cả</button>
                </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {scriptData.map((scene, idx) => {
                    const assets = sceneAssets[scene.id] || {};
                    const isActive = activeSceneId === scene.id;
                    return (
                        <div key={scene.id} onClick={() => setActiveSceneId(scene.id)} className={`p-3 rounded-xl border cursor-pointer flex gap-4 items-start group ${isActive ? 'border-blue-500 bg-slate-800/80' : 'border-slate-700 bg-slate-800'}`}>
                            <div className="relative w-28 h-24 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 border border-slate-700 overflow-hidden">
                                <span className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
                                    {scene.isTitle ? 'TITLE' : scene.isOutro ? 'OUTRO' : `SCENE ${idx}`}
                                </span>
                                {assets.isLoadingImage ? <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" /> : assets.imageUrl ? <img src={assets.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-600" />}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col space-y-2">
                                <textarea 
                                    value={scene.visual} 
                                    onChange={(e) => updateSceneContent(scene.id, 'visual', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-slate-900/80 p-2 rounded text-slate-300 text-xs border border-slate-700 resize-none h-14 focus:ring-1 focus:ring-blue-500 custom-scrollbar" 
                                    placeholder="Mô tả hình ảnh (Visual prompt)..."
                                />
                                <p className={`text-sm truncate ${scene.isTitle || scene.isOutro ? 'text-indigo-300 font-medium' : 'text-slate-300'}`} title={scene.narration}>"{scene.narration}"</p>
                                <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); generateSceneImage(scene.id, scene.visual); }} disabled={assets.isLoadingImage} className="text-[11px] px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded flex"><ImageIcon className="w-3 h-3 mr-1" /> {assets.imageUrl ? 'Re-gen Ảnh' : 'Gen Ảnh'}</button>
                                    <button onClick={(e) => { e.stopPropagation(); generateSceneAudio(scene.id, scene.narration); }} disabled={assets.isLoadingAudio} className="text-[11px] px-2 py-1 bg-blue-900/50 hover:bg-blue-800/50 text-blue-200 rounded flex"><Mic className="w-3 h-3 mr-1" /> {assets.audioUrl ? 'Re-gen Audio' : 'Gen Audio'}</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-blue-400 mb-3 w-full flex items-center justify-center">
              <Play className="w-4 h-4 mr-1" /> Review {activeSceneData?.isTitle ? 'Cảnh Tiêu Đề' : activeSceneData?.isOutro ? 'Cảnh Kết' : `Cảnh`}
            </h3>
            
            <div className={`bg-black border-2 border-slate-700 overflow-hidden flex flex-col items-center justify-center shadow-2xl transition-all ${isPreviewExpanded ? 'fixed inset-0 m-auto z-50 rounded-none' : 'relative rounded-xl'}`} style={{ width: `${mockVideoWidth}px`, height: `${mockVideoHeight}px`, maxHeight: isPreviewExpanded ? '100vh' : 'auto' }}>
                <button onClick={() => setIsPreviewExpanded(!isPreviewExpanded)} className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-black/80">
                  {isPreviewExpanded ? <Minimize2 className="w-5 h-5"/> : <Maximize2 className="w-5 h-5"/>}
                </button>

                {activeAssets?.imageUrl ? <img src={activeAssets.imageUrl} className="w-full h-full object-cover opacity-90" /> : <div className="text-slate-600"><ImageIcon className="w-12 h-12 mb-2 opacity-30" /></div>}

                {/* Subtitle Preview Overlay */}
                {activeSceneData?.isTitle || activeSceneData?.isOutro ? (
                    videoSettings.showTitleOutroText && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 px-4 text-center z-10 pointer-events-none">
                            <h1 className={`${isPreviewExpanded ? 'text-6xl' : 'text-3xl'} font-bold text-yellow-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] leading-tight`}>
                                {activeSceneData.narration}
                            </h1>
                        </div>
                    )
                ) : (
                    videoSettings.subStyle !== 'none' && (
                        <div className={`absolute left-0 right-0 px-4 text-center z-10 pointer-events-none ${isPreviewExpanded ? 'bottom-16' : 'bottom-6'}`}>
                            <span className={`inline-block px-3 py-1.5 rounded font-bold bg-black/60 backdrop-blur-sm shadow-md ${isPreviewExpanded ? 'text-3xl' : 'text-sm'}`}>
                                {videoSettings.subStyle === 'classic' ? (
                                    <span className="text-white">{activeSceneData?.narration || 'Phụ đề hiển thị ở đây'}</span>
                                ) : (
                                    previewWordsArray.map((word, idx) => (
                                        <span key={idx} className={idx <= previewActiveWordIndex ? 'text-yellow-400 drop-shadow-md' : 'text-white'}>
                                            {word}{" "}
                                        </span>
                                    ))
                                )}
                            </span>
                        </div>
                    )
                )}

                {activeAssets?.audioUrl && (
                    <button 
                        onClick={togglePlayReview}
                        className={`absolute inset-0 m-auto bg-blue-600/80 hover:bg-blue-500 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-transform hover:scale-110 shadow-xl z-20 ${isPreviewExpanded ? 'w-24 h-24' : 'w-12 h-12'}`}
                    >
                        {isPlayingPreview ? <Pause className={`${isPreviewExpanded ? 'w-12 h-12' : 'w-6 h-6'}`} /> : <Play className={`${isPreviewExpanded ? 'w-12 h-12' : 'w-6 h-6'} ml-1`} />}
                    </button>
                )}
            </div>
            {isPreviewExpanded && <div className="fixed inset-0 bg-black/90 z-40" onClick={() => setIsPreviewExpanded(false)}></div>}
            <audio 
                ref={audioPlayerRef} 
                className="hidden" 
                onPlay={() => setIsPlayingPreview(true)}
                onPause={() => setIsPlayingPreview(false)}
                onEnded={() => setIsPlayingPreview(false)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }`}</style>
      
      {/* Toast Errors */}
      {errorMsg && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] bg-blue-600/95 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center"><Info className="w-5 h-5 mr-3" /> <span className="font-medium text-sm">{errorMsg}</span></div>}
      
      {/* History Modal Overlay */}
      {showHistory && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
             <div className="p-4 border-b border-slate-800 flex justify-between items-center">
               <h2 className="text-xl font-bold text-white flex items-center"><History className="w-5 h-5 mr-2" /> Lịch sử Kịch bản</h2>
               <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white"><XCircle className="w-6 h-6" /></button>
             </div>
             <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
               {historyList.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Chưa có lịch sử nào.</p>
               ) : historyList.map(item => (
                  <div key={item.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center group hover:border-blue-500 transition-colors">
                     <div>
                       <h3 className="font-semibold text-white truncate max-w-[300px]">{item.title}</h3>
                       <p className="text-xs text-slate-400 flex items-center mt-1"><Clock className="w-3 h-3 mr-1"/> {item.date}</p>
                     </div>
                     <div className="flex space-x-2">
                       <button onClick={() => handleLoadHistory(item)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium shadow">Mở lại</button>
                       <button onClick={() => handleDeleteHistory(item.id)} className="p-2 bg-red-900/30 text-red-400 hover:bg-red-900/60 hover:text-red-300 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                     </div>
                  </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* Video Rendering Overlay */}
      {isRendering && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center">
           <div className="w-64 bg-slate-800 rounded-full h-4 mb-4 overflow-hidden"><div className="bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all duration-300" style={{ width: `${renderProgress}%` }}></div></div>
           <p className="text-xl font-bold text-white mb-4">Đang Xuất Video... {renderProgress}%</p>
           <button onClick={() => cancelProcessRef.current = true} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center font-medium shadow-lg transition-colors">
              <XCircle className="w-5 h-5 mr-2" /> Huỷ xuất Video
           </button>
           <p className="text-sm text-slate-400 mt-4 text-center max-w-sm">Mẹo: Vui lòng để máy chạy tab này và không ẩn trình duyệt để video lưu lại được mượt mà nhất!</p>
        </div>
      )}

      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center"><Clapperboard className="w-5 h-5 text-white" /></div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Content2Video Studio</h1>
          </div>
          <div className="flex items-center space-x-4">
             {/* New Video & History Navigation */}
             <div className="flex bg-slate-800 rounded-lg p-1 space-x-1">
                 <button onClick={handleNewVideo} className="flex items-center px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors">
                    <FilePlus2 className="w-4 h-4 mr-1.5" /> Tạo Video Mới
                 </button>
                 <button onClick={() => setShowHistory(true)} className="flex items-center px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors">
                    <History className="w-4 h-4 mr-1.5" /> Lịch sử
                 </button>
             </div>

             <div className="flex text-sm font-medium space-x-1 hidden md:flex">
               {[1, 2, 3, 4].map(s => {
                 const isActive = step === s;
                 return (
                   <div key={s} className="flex items-center">
                     <div onClick={() => s <= maxStepReached && !isRendering && setStep(s)} className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${s <= maxStepReached && !isRendering ? 'cursor-pointer hover:ring-2 ring-blue-500/50' : 'opacity-50'} ${isActive ? 'bg-blue-600 text-white' : step > s ? 'bg-blue-900/50 text-blue-300' : 'bg-slate-800 text-slate-500'}`}>
                       {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                     </div>
                     {s < 4 && <div className={`w-10 h-[2px] mx-1 ${step > s ? 'bg-blue-600' : 'bg-slate-800'}`} />}
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 relative">
        {loadingMsg && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
             <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
             <p className="text-lg font-medium text-white animate-pulse mb-4">{loadingMsg}</p>
             {isCancellable && (
                <button onClick={() => cancelProcessRef.current = true} className="px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white rounded-lg flex items-center text-sm font-medium transition-colors shadow-lg">
                   <XCircle className="w-4 h-4 mr-2" /> Dừng tiến trình
                </button>
             )}
          </div>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </main>
    </div>
  );
}