"use client";

import { useState, useEffect } from "react";

export default function DeepShieldApp() {
  // --- STATE MANAGERS ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  
  // Auth States
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authSuccess, setAuthSuccess] = useState(false);

  // Dashboard States
  const [serverStatus, setServerStatus] = useState("Checking connection...");
  const [isScanning, setIsScanning] = useState(false);
  const [scanData, setScanData] = useState({ threats: "-", darkWeb: "-", score: "-" });

  // --- AUTHENTICATION LOGIC ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage("Authenticating with Vault...");
    
    const endpoint = isRegistering ? '/register' : '/login';

    try {
      const res = await fetch(`https://deepshield-oefy.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setAuthSuccess(true);
        setAuthMessage("Access Granted. Initializing Dashboard...");
        setUserEmail(emailInput);
        
        // Wait 1 second so they see the success message, then open the dashboard!
        setTimeout(() => {
          setIsAuthenticated(true);
        }, 1000);

      } else {
        setAuthSuccess(false);
        setAuthMessage("Access Denied: " + data.detail);
      }
    } catch (error) {
      setAuthSuccess(false);
      setAuthMessage("Critical Error: Cannot reach Python Backend.");
    }
  };

  // --- DASHBOARD LOGIC ---
  useEffect(() => {
    if (isAuthenticated) {
      fetch('https://deepshield-oefy.onrender.com/health')
        .then(res => res.json())
        .then(data => setServerStatus(data.message))
        .catch(() => setServerStatus("Backend Offline"));
    }
  }, [isAuthenticated]);

  const startScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('https://deepshield-oefy.onrender.com/scan');
      const data = await res.json();
      setScanData({ threats: data.threats_found, darkWeb: data.dark_web, score: data.score });
    } catch (error) {
      alert("Scan failed!");
    }
    setIsScanning(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmailInput("");
    setPasswordInput("");
    setAuthMessage("");
    setScanData({ threats: "-", darkWeb: "-", score: "-" });
  };

  // ==========================================
  // VIEW 1: THE AUTHENTICATION SCREEN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center font-sans text-white">
        <div className="w-full max-w-md bg-gray-900 border border-green-500/30 p-8 rounded-lg shadow-[0_0_30px_rgba(74,222,128,0.1)]">
          <h1 className="text-3xl font-bold text-center text-green-400 tracking-widest mb-2">DEEPSHIELD</h1>
          <p className="text-center text-gray-400 mb-8">
            {isRegistering ? "Initialize New Operator Identity" : "Operator Authentication"}
          </p>

          <form onSubmit={handleAuth} className="flex flex-col space-y-6">
            <div>
              <label className="block text-sm text-gray-500 uppercase tracking-wide mb-2">Secure Email</label>
              <input 
                type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-green-500"
                placeholder="operator@deepshield.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 uppercase tracking-wide mb-2">Passphrase</label>
              <input 
                type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-green-500"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full bg-green-500 hover:bg-green-400 text-black font-extrabold py-3 rounded transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(74,222,128,0.3)]">
              {isRegistering ? "SECURE ACCOUNT" : "AUTHENTICATE"}
            </button>
          </form>

          {authMessage && (
            <div className={`mt-6 p-3 text-center rounded border ${authSuccess ? 'bg-green-900/30 text-green-400 border-green-500/50' : 'bg-red-900/30 text-red-400 border-red-500/50'}`}>
              {authMessage}
            </div>
          )}

          <div className="mt-8 text-center">
            <button onClick={() => {setIsRegistering(!isRegistering); setAuthMessage("");}} className="text-gray-500 hover:text-white transition-colors text-sm">
              {isRegistering ? "Already have an identity? Login here." : "Need an identity? Register here."}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: THE SECURE DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-black text-white font-sans flex">
      {/* Sidebar Menu */}
      <div className="w-64 bg-gray-900 border-r border-green-500/30 p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold text-green-400 tracking-wider mb-10">DEEPSHIELD</h2>
          <nav className="flex flex-col space-y-4 text-gray-400">
            <a href="#" className="text-green-400 font-bold">Dashboard</a>
            <a href="#" className="hover:text-green-400 transition">Identity Scans</a>
            <a href="#" className="hover:text-green-400 transition">Threat Alerts</a>
          </nav>
        </div>
        
        {/* User Profile & Logout */}
        <div className="border-t border-gray-800 pt-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Active Operator</p>
          <p className="text-sm font-bold text-gray-300 truncate mb-4">{userEmail}</p>
          <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 transition w-full text-left">
            Disconnect Session
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-10">
        <header className="mb-10 pb-4 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-3xl font-light text-gray-200">System <span className="text-green-400 font-bold">Overview</span></h1>
          <div className="text-sm px-4 py-2 rounded-full border text-green-400 bg-green-900/30 border-green-500/50">
            {serverStatus}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-gray-500 text-sm mb-2 font-bold uppercase tracking-wide">Active Threats</h3>
            <p className="text-4xl font-bold text-white">{scanData.threats}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-gray-500 text-sm mb-2 font-bold uppercase tracking-wide">Dark Web Mentions</h3>
            <p className="text-4xl font-bold text-green-400">{scanData.darkWeb}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-gray-500 text-sm mb-2 font-bold uppercase tracking-wide">Security Score</h3>
            <p className="text-4xl font-bold text-blue-400">{scanData.score}</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-10 rounded-lg shadow-lg flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Initiate Deep Scan</h2>
          <p className="text-gray-400 mb-6 max-w-lg">
            Scan the dark web, public databases, and social platforms for any leaked credentials.
          </p>
          <button onClick={startScan} disabled={isScanning} className={`font-extrabold py-3 px-8 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(74,222,128,0.4)] ${isScanning ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-400 text-black transform hover:scale-105"}`}>
            {isScanning ? "SCANNING NETWORK..." : "START IDENTITY SCAN"}
          </button>
        </div>
      </div>
    </div>
  );
}