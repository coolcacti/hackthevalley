import React, { useEffect, useRef, useState } from "react";
import "./camera.css";
import { useNavigate } from "react-router-dom";

// We'll dynamically import TF so the bundle isn't huge until needed
// npm install @tensorflow/tfjs @tensorflow-models/coco-ssd

export default function TrashRecorder() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const modelRef = useRef(null);
  const locationRef = useRef(null); // Store location coordinates

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState({ name: "Samuel", avatar: "https://i.pravatar.cc/40" });

  const [isRecording, setIsRecording] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [status, setStatus] = useState("idle"); // 'idle' | 'ready' | 'recording' | 'sending' | 'sent-success' | 'send-error'
  const [detections, setDetections] = useState([]);
  const [summary, setSummary] = useState({ Recyclable: 0, Compost: 0, Trash: 0 });
  const [lastDetectedObjects, setLastDetectedObjects] = useState([]);
  const [locationStatus, setLocationStatus] = useState("not-requested"); // Track GPS status

  const categoryMap = {
    bottle: "Recyclable",
    cup: "Recyclable",
    can: "Recyclable",
    book: "Recyclable",
    banana: "Compost",
    apple: "Compost",
    orange: "Compost",
    sandwich: "Compost",
    chair: "Trash",
    tv: "Trash",
    remote: "Trash",
    cell_phone: "Trash",
    laptop: "Trash",
    handbag: "Trash",
    backpack: "Trash",
  };

  const labelToCategory = (label) => {
    const l = label.toLowerCase().trim();
    
    // Exclude people/humans - check this FIRST
    if (l.includes("person") || l.includes("people") || l.includes("human") || l.includes("man") || l.includes("woman") || l.includes("child")) {
      return "person";
    }
    
    // Check exact matches in categoryMap
    if (categoryMap[l]) return categoryMap[l];
    
    // Check recyclables
    if (l.includes("bottle") || l.includes("cup") || l.includes("can") || l.includes("glass")) {
      return "Recyclable";
    }
    
    // Check compost
    if (["banana", "apple", "orange", "sandwich", "hotdog"].some(x => l.includes(x))) {
      return "Compost";
    }
    
    // Default to Trash
    return "Trash";
  };

  // Request GPS location
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("not-supported");
      console.warn("Geolocation is not supported by this browser");
      return;
    }

    setLocationStatus("requesting");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        locationRef.current = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setLocationStatus("acquired");
        console.log("Location acquired:", locationRef.current);
      },
      (error) => {
        setLocationStatus("denied");
        console.error("Error getting location:", error.message);
        // Continue without location - don't block recording
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Camera init
  useEffect(() => {
    let mounted = true;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("ready");
        
        // Request location when camera is ready
        requestLocation();
      } catch (err) {
        console.error("Camera error:", err);
        setStatus("camera-error");
      }
    };
    initCamera();
    return () => {
      mounted = false;
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Load model
  useEffect(() => {
    let mounted = true;
    const loadModel = async () => {
      try {
        setStatus(s => (s === "ready" ? "loading-model" : s));
        const tf = await import("@tensorflow/tfjs");
        const coco = await import("@tensorflow-models/coco-ssd");
        modelRef.current = await coco.load();
        if (!mounted) return;
        setStatus("ready");
      } catch (err) {
        console.error("Model load error:", err);
        setStatus("model-error");
      }
    };
    loadModel();
    return () => { mounted = false; };
  }, []);

  // Detection loop
  useEffect(() => {
    let rafId = null;
    const detectFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || !modelRef.current) {
        rafId = requestAnimationFrame(detectFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      try {
        const predictions = await modelRef.current.detect(video);
        const filtered = predictions.filter(p => p.score > 0.45);
        setDetections(filtered);

        const counts = { Recyclable: 0, Compost: 0, Trash: 0 };
        const detectedLabels = [];
        filtered.forEach(p => {
          const cat = labelToCategory(p.class);
          counts[cat] = (counts[cat] || 0) + 1;
          detectedLabels.push({ label: p.class, category: cat, score: p.score });
        });
        setSummary(counts);
        setLastDetectedObjects(detectedLabels);

        // draw overlay
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        filtered.forEach(p => {
          const [x, y, w, h] = p.bbox;
          const cat = labelToCategory(p.class);
          const color = cat === "Recyclable" ? "#4e8f41" : cat === "Compost" ? "#c07b2b" : "#9b2f2f";
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(2, canvas.width * 0.003);
          ctx.strokeRect(x, y, w, h);

          ctx.fillStyle = color;
          ctx.font = `${Math.max(12, canvas.width * 0.03)}px Inter, Arial`;
          const label = `${p.class} ${(p.score * 100).toFixed(0)}% • ${labelToCategory(p.class)}`;
          const textWidth = ctx.measureText(label).width + 8;
          ctx.fillRect(x, y - 28, textWidth, 24);
          ctx.fillStyle = "#fff";
          ctx.fillText(label, x + 4, y - 8);
        });
      } catch (e) {
        console.error("detect error", e);
      } finally {
        if (isDetecting) rafId = requestAnimationFrame(detectFrame);
      }
    };

    if (isDetecting) detectFrame();
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [isDetecting]);

  // Recording
  const startRecording = () => {
    const stream = videoRef.current.srcObject;
    if (!stream) return alert("Camera not initialized.");
    
    // Update location right before recording starts
    if (locationStatus === "acquired") {
      requestLocation(); // Refresh location
    }
    
    chunksRef.current = [];
    recorderRef.current = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });

    recorderRef.current.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setStatus("ready-to-send");
      recorderRef.current.recordedBlob = blob;
    };

    recorderRef.current.start();
    setIsRecording(true);
    setIsDetecting(true);
    setStatus("recording");
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
    setIsDetecting(false);
    
    // Turn off camera
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setStatus("ready");
  };

  // Integrated sendRecording function with location data
  const sendRecording = async () => {
    if (!recorderRef.current || !recorderRef.current.recordedBlob) return alert("No recording available.");

    const form = new FormData();
    form.append("video", recorderRef.current.recordedBlob, "recording.webm");
    
    // Prepare data to send
    const dataToSend = {
      summary,
      lastDetectedObjects,
      location: locationRef.current || null // Include location coordinates
    };
    
    form.append("data", JSON.stringify(dataToSend));

    try {
      setStatus("sending");
      const res = await fetch("http://localhost:5001/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      console.log("Server response:", data);
      
      // Show success screen instead of alert
      setStatus("sent-success");
    } catch (err) {
      console.error(err);
      setStatus("send-error");
    }
  };

  // Helper to display location status
  const getLocationIcon = () => {
    switch (locationStatus) {
      case "acquired": return "📍";
      case "requesting": return "⏳";
      case "denied": return "❌";
      case "not-supported": return "🚫";
      default: return "📍";
    }
  };

  const goBack = () => {
    navigate('/app');
  }

  // Show loading screen while setting up
  if (status === "idle" || status === "loading-model") {
    return <div className='loading-text'>Loading camera and AI model...</div>;
  }

  // Show sending screen
  if (status === "sending") {
    return <div className='loading-text'>Sending video to AI model...</div>;
  }

  // Show success screen with summary
  if (status === "sent-success") {
    return (
      <div className='success-text'>
        <div style={{ fontSize: "24px", marginBottom: "20px", fontWeight: "bold" }}>✅ Successfully Sent!</div>
        <div style={{ fontSize: "18px", marginBottom: "30px" }}>Here's what you picked up:</div>
        <div style={{ display: "flex", flexDirection: "row",justifyContent: "space-around", width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px" }}>♻️</div>
            <div style={{ fontSize: "14px", color: "#4e8f41" }}>Recyclable</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{summary.Recyclable}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px" }}>🍂</div>
            <div style={{ fontSize: "14px", color: "#c07b2b" }}>Compost</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{summary.Compost}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px" }}>🗑</div>
            <div style={{ fontSize: "14px", color: "#9b2f2f" }}>Trash</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{summary.Trash}</div>
          </div>
        </div>

        <button 
          onClick={goBack} 
          style={{
            marginTop: "20px",
            padding: "12px 30px",
            background: "#4e8f41",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Back Home
        </button>
      </div>
    );
  }

  // Show error screen with retry option
  if (status === "send-error") {
    return (
      <div className='loading-text'>
        <div>Failed to send video. Please try again later.</div>
        <button 
          onClick={goBack} 
          style={{
            marginTop: "10px",
            padding: "12px 30px",
            background: "#4e8f41",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // Show error states
  if (status === "camera-error") {
    return <div className='loading-text'>Camera access denied. Please enable camera permissions.</div>;
  }

  if (status === "model-error") {
    return <div className='loading-text'>Failed to load AI model. Please refresh.</div>;
  }

  return (
    <div className="app-phone-root">
      <div className="phone-frame">
        <div className="top-bar">
          <button className="btn back" onClick={goBack}>&#60;</button>
          <div className="app-heading">Scan for Trash</div>
          <div style={{ position: "relative" }}>
            {dropdownOpen && (
              <div className="avatar-menu">
                <div>Hello, {user.name}</div>
                <button onClick={() => alert("Profile")}>Profile</button>
                <button onClick={() => alert("Logout")}>Logout</button>
              </div>
            )}
          </div>
        </div>

        <div className="camera-area">
          <video ref={videoRef} className="camera-video" playsInline muted />
          <canvas ref={canvasRef} className="camera-canvas" />
          
          {/* Location indicator */}
          <div style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "rgba(0,0,0,0.6)",
            color: "white",
            padding: "5px 10px",
            borderRadius: "5px",
            fontSize: "12px"
          }}>
            {getLocationIcon()} {locationStatus === "acquired" ? "GPS Active" : "GPS: " + locationStatus}
          </div>
        </div>

        <div className="info-panel">
          <div className="summary">
            <div className="sum-item recyclable">
              <div className="icon">♻️</div>
              <div className="label">Recycle</div>
              <div className="value">{summary.Recyclable}</div>
            </div>
            <div className="sum-item compost">
              <div className="icon">🍂</div>
              <div className="label">Compost</div>
              <div className="value">{summary.Compost}</div>
            </div>
            <div className="sum-item trash">
              <div className="icon">🗑</div>
              <div className="label">Trash</div>
              <div className="value">{summary.Trash}</div>
            </div>
          </div>
        </div>

        <div className="controls">
          {!isRecording ? (
            <button className="record-btn" onClick={startRecording}>● RECORD</button>
          ) : (
            <button className="stop-btn" onClick={stopRecording}>■ STOP</button>
          )}
          {status === "ready-to-send" && (
            <button className="send-btn" onClick={sendRecording}>📤 SEND</button>
          )}
        </div>
      </div>
    </div>
  );
}