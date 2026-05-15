import React, { useState, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';
import './App.css';

const App = () => {
  const [role, setRole] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [clues, setClues] = useState([]);
  const [puzzleStep, setPuzzleStep] = useState(1); // 1: Clock, 2: Ledger, 3: Safe
  const [status, setStatus] = useState('Başlatılıyor...');
  const [connected, setConnected] = useState(false);
  
  const peerRef = useRef(null);
  const connRef = useRef(null);

  useEffect(() => {
    if (isJoined && role) {
      const peerId = role === 'past' ? `antigravity-game-past-${roomId}` : `antigravity-game-future-${roomId}`;
      const peer = new Peer(peerId, {
        config: { 'iceServers': [{ url: 'stun:stun.l.google.com:19302' }] }
      });
      peerRef.current = peer;

      peer.on('open', () => setStatus('Sistem Çevrimiçi.'));
      peer.on('connection', (conn) => setupConnection(conn));
      peer.on('error', () => {
        if (role === 'future') setTimeout(attemptConnection, 3000);
      });
      return () => peer.destroy();
    }
  }, [isJoined, role, roomId]);

  const attemptConnection = () => {
    if (!peerRef.current || connected) return;
    const conn = peerRef.current.connect(`antigravity-game-past-${roomId}`, { reliable: true });
    setupConnection(conn);
  };

  const setupConnection = (conn) => {
    connRef.current = conn;
    conn.on('open', () => {
      setConnected(true);
      setStatus('BAĞLANDI!');
    });

    conn.on('data', (data) => {
      if (data.type === 'next-step') {
        setPuzzleStep(data.step);
      } else {
        setClues((prev) => [...prev, data]);
      }
    });
  };

  const sendClue = (type, value) => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type, value });
    }
  };

  const nextStep = (step) => {
    setPuzzleStep(step);
    sendClue('next-step', step);
  };

  if (!isJoined) {
    return (
      <div className="choice-screen" style={{ flexDirection: 'column', background: '#0a0a0c' }}>
        <h1 className="glitch" data-text="ZAMAN ÖTESİ BAĞLANTI">ZAMAN ÖTESİ BAĞLANTI</h1>
        <div className="terminal-window" style={{ marginTop: '2rem' }}>
          <p>Oda Numarası:</p>
          <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)} style={{ background: 'transparent', border: '1px solid var(--future-accent)', color: 'white', padding: '1rem', width: '100%', textAlign: 'center' }} />
          <button onClick={() => setIsJoined(true)} style={{ marginTop: '1rem', width: '100%' }}>GİRİŞ</button>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="choice-screen">
        <div className="choice-side past" onClick={() => setRole('past')}><h1>GEÇMİŞ</h1><button>BAŞLA</button></div>
        <div className="choice-side future" onClick={() => setRole('future')}><h1>GELECEK</h1><button>BAĞLAN</button></div>
      </div>
    );
  }

  return (
    <div className={`app-container ${role}-view`}>
      {!connected && (
        <div className="success-overlay" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <h2 className="glitch">{status}</h2>
          {role === 'future' && <button onClick={attemptConnection}>BAĞLANMAYI DENE</button>}
        </div>
      )}

      <div className="game-content">
        {role === 'past' ? (
          <PastWorkflow step={puzzleStep} onNext={nextStep} sendClue={sendClue} incomingClues={clues} />
        ) : (
          <FutureWorkflow step={puzzleStep} onNext={nextStep} sendClue={sendClue} incomingClues={clues} />
        )}
      </div>
    </div>
  );
};

const PastWorkflow = ({ step, onNext, sendClue, incomingClues }) => {
  const [input, setInput] = useState('');
  
  return (
    <div className="game-view past">
      <h2>ADIM {step}: {step === 1 ? 'Antika Saat' : step === 2 ? 'Tozlu Defter' : 'Kilitli Kasa'}</h2>
      
      {step === 1 && (
        <div className="paper-note">
          <p>Saati doğru zamana ayarla...</p>
          <input type="text" placeholder="00:00" onChange={(e) => setInput(e.target.value)} />
          <button onClick={() => input.trim() === '04:20' && onNext(2)}>AYARLA</button>
        </div>
      )}

      {step === 2 && (
        <div className="paper-note">
          <p>Defterde bir isim karalanmış: <strong>AURELIUS</strong></p>
          <p>Gelecekteki torununa bu ismi ilet.</p>
          <button onClick={() => sendClue('text', 'AURELIUS')}>İSMİ GÖNDER</button>
        </div>
      )}

      {step === 3 && (
        <div className="paper-note">
          <p>Kasanın şifresini gir:</p>
          <input type="text" placeholder="3 Haneli Şifre" onChange={(e) => setInput(e.target.value)} />
          <button onClick={() => input.trim() === '852' && onNext(4)}>KASAYI AÇ</button>
          <p style={{ marginTop: '1rem', fontSize: '0.8rem' }}>* İpucu gelecekteki ekranda olabilir.</p>
        </div>
      )}

      {step === 4 && <div className="success-overlay"><h1>OYUN TAMAMLANDI!</h1><p>Geçmiş ve gelecek birleşti.</p></div>}

      <div className="clues-received">
        {incomingClues.map((c, i) => <div key={i} className="paper-note" style={{ background: '#e0fbfc' }}>{c.value}</div>)}
      </div>
    </div>
  );
};

const FutureWorkflow = ({ step, onNext, sendClue, incomingClues }) => {
  const [input, setInput] = useState('');

  return (
    <div className="game-view future">
      <h2>MISSION STATUS: PHASE {step}</h2>
      
      {step === 1 && (
        <div className="terminal-window mission-panel">
          <p>[ARŞİV] Saat mekanizması 04:20'de tetiklenir.</p>
          <button onClick={() => sendClue('future-clue', 'Saati 04:20 yap!')}>İPUCU GÖNDER</button>
        </div>
      )}

      {step === 2 && (
        <div className="terminal-window mission-panel">
          <p>SİSTEM KİLİTLİ: Mirasçının ismini girin.</p>
          <input type="text" onChange={(e) => setInput(e.target.value)} />
          <button onClick={() => input.toUpperCase() === 'AURELIUS' && onNext(3)}>DOĞRULA</button>
          <p style={{ marginTop: '1rem' }}>Gelen Mesajlar:</p>
          {incomingClues.filter(c => c.type === 'text').map((c, i) => <p key={i} color="#ff00c1">> {c.value}</p>)}
        </div>
      )}

      {step === 3 && (
        <div className="terminal-window mission-panel">
          <p>KASA KOORDİNATI: (X:8, Y:5, Z:2)</p>
          <p>Bu numaraları geçmişe gönder!</p>
          <button onClick={() => sendClue('future-clue', 'Şifre: 852')}>ŞİFREYİ GÖNDER</button>
        </div>
      )}

      {step === 4 && <div className="success-overlay"><h1>BAŞARDINIZ!</h1><p>Tüm veriler kurtarıldı.</p></div>}
    </div>
  );
};

export default App;
