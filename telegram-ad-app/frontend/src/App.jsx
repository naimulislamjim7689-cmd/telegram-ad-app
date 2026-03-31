import React, { useEffect, useState } from 'react';
import axios from 'axios';

const tele = window.Telegram.WebApp;
const BACKEND_URL = "https://telegram-ad-app.onrender.com"; // Change later

function App() {
  const [user, setUser] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    tele.ready();
    login();
  }, []);

  const login = async () => {
    const res = await axios.post(`${BACKEND_URL}/api/login`, { initData: tele.initData });
    setUser(res.data);
  };

  const startAd = () => {
    setIsWatching(true);
    setTimer(15);
    
    // Trigger Monetag Ad (Look for the function name in your Monetag script)
    if (typeof 10803501 === 'function') {
      10803501(); 
    }
  };

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && isWatching) {
      claimReward();
    }
    return () => clearInterval(interval);
  }, [timer]);

  const claimReward = async () => {
    const res = await axios.post(`${BACKEND_URL}/api/reward`, { initData: tele.initData });
    setUser(prev => ({ ...prev, balance: res.data.balance }));
    setIsWatching(false);
    
    // Automation: Start next ad after 2 seconds
    setTimeout(() => startAd(), 2000);
  };

  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: '#111', minHeight: '100vh' }}>
      <h1>Balance: {user?.balance || 0} Coins</h1>
      
      {isWatching ? (
        <div style={{ fontSize: '24px', margin: '20px' }}>Next Reward in: {timer}s</div>
      ) : (
        <button onClick={startAd} style={{ padding: '15px 30px', fontSize: '18px' }}>
          Watch Ad & Earn
        </button>
      )}
    </div>
  );
}
export default App;
