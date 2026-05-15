import React, { useState, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';
import './App.css';

const App = () => {
  const [role, setRole] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [clues, setClues] = useState([]);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const peerRef = useRef(null);
  const connRef = useRef(null);

  useEffect(() => {
    if (isJoined && role) {
      // PeerJS ID'si rol ve oda numarasına göre oluşturulur
      // Strateji: GEÇMİŞ sunucu (host) olur, GELECEK ona bağlanır.
      const peerId = role === 'past' ? `timeless-past-${roomId}` : `timeless-future-${roomId}`;
      const peer = new Peer(peerId);
      peerRef.current = peer;

      peer.on('open', (id) => {
        console.log('Bağlantı ID:', id);
        if (role === 'future') {
          // Gelecek oyuncusu geçmişe bağlanmaya çalışır
          const conn = peer.connect(`timeless-past-${roomId}`);
          setupConnection(conn);
        }
      });

      peer.on('connection', (conn) => {
        // Geçmiş oyuncusu bağlantıyı kabul eder
        setupConnection(conn);
      });

      return () => {
        peer.destroy();
      };
    }
  }, [isJoined, role, roomId]);

  const setupConnection = (conn) => {
    connRef.current = conn;
    conn.on('open', () => {
      setConnected(true);
      console.log('Bağlantı kuruldu!');
    });

    conn.on('data', (data) => {
      if (data.type === 'puzzle-success') {
        setPuzzleSolved(true);
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

  if (!isJoined) {
    return (
      <div className="choice-screen" style={{ flexDirection: 'column', background: '#0a0a0c' }}>
        <h1 className="glitch" data-text="ZAMAN ÖTESİ BAĞLANTI">ZAMAN ÖTESİ BAĞLANTI</h1>
        <div className="terminal-window" style={{ marginTop: '2rem' }}>
          <p>Bir Oda Numarası Girin:</p>
          <input 
            type="text" 
            placeholder="Örn: 5555" 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{ background: 'transparent', border: '1px solid var(--future-accent)', color: 'white', padding: '1rem', marginTop: '1rem', width: '100%', fontSize: '1.5rem', textAlign: 'center' }}
          />
          <button 
            disabled={!roomId}
            onClick={() => setIsJoined(true)}
            style={{ marginTop: '1rem', width: '100%' }}
          >
            SİSTEME GİRİŞ YAP
          </button>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="choice-screen">
        <div className="choice-side past" onClick={() => setRole('past')}>
          <h1>GEÇMİŞ</h1>
          <p>Oda: {roomId}</p>
          <button>Geçmişe Git</button>
        </div>
        <div className="choice-side future" onClick={() => setRole('future')}>
          <h1 className="glitch" data-text="GELECEK">GELECEK</h1>
          <p>Oda: {roomId}</p>
          <button>Geleceğe Bağlan</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${role}-view`}>
      {!connected && (
        <div className="success-overlay" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <h2>Bağlantı Bekleniyor...</h2>
          <p>Diğer oyuncunun odaya girmesini bekleyin.</p>
        </div>
      )}
      {puzzleSolved && (
        <div className="success-overlay">
          <h1 className={role === 'future' ? 'glitch' : ''} data-text="BAĞLANTI KURULDU">BAĞLANTI KURULDU</h1>
          <p>{role === 'past' ? 'Torununla iletişim kanalı açıldı!' : 'Geçmişten gelen veriler sisteme yüklendi.'}</p>
          <button onClick={() => setPuzzleSolved(false)}>Devam Et</button>
        </div>
      )}
      {role === 'past' ? (
        <PastView sendClue={sendClue} incomingClues={clues} onSolve={() => sendClue('puzzle-success', true)} />
      ) : (
        <FutureView sendClue={sendClue} incomingClues={clues} />
      )}
    </div>
  );
};

const PastView = ({ sendClue, incomingClues, onSolve }) => {
  const [clockTime, setClockTime] = useState('');
  const [feedback, setFeedback] = useState('');

  const checkClock = () => {
    if (clockTime === '04:20') {
      setFeedback('Saat tıkırdadı ve bir bölme açıldı!');
      onSolve();
    } else {
      setFeedback('Hiçbir şey olmadı...');
    }
  };

  return (
    <div className="game-view past">
      <header>
        <h2>Zaman Ötesi Bağlantı: Geçmiş</h2>
        <p>Evin tozlu raflarında bir şeyler bulmalısın...</p>
      </header>

      <main style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <div className="paper-note">
          <h3>Antika Duvar Saati</h3>
          <p>Saatin yelkovanı ve akrebi garip bir şekilde durmuş. Bir saate ayarlanması gerekiyor gibi görünüyor.</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="00:00" 
              value={clockTime}
              onChange={(e) => setClockTime(e.target.value)}
              style={{ width: '80px', padding: '0.5rem', background: 'rgba(0,0,0,0.1)', border: '1px solid #3d3023' }}
            />
            <button onClick={checkClock}>Ayarla</button>
          </div>
          {feedback && <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>{feedback}</p>}
        </div>

        <div className="clues-received">
          <h3>Gelecekten Gelen Yankılar:</h3>
          {incomingClues.filter(c => c.type === 'future-clue').map((c, i) => (
            <div key={i} className="paper-note" style={{ marginTop: '1rem', background: '#e0fbfc', border: '2px dashed var(--future-accent)' }}>
              <strong>SİNYAL ALINDI:</strong>
              <p>{c.value}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const FutureView = ({ sendClue, incomingClues }) => {
  const [terminalInput, setTerminalInput] = useState('');

  return (
    <div className="game-view future">
      <header>
        <h2 className="glitch" data-text="SYSTEM: MISSION CONTROL">SYSTEM: MISSION CONTROL</h2>
      </header>

      <main style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <div className="terminal-window mission-panel" style={{ borderColor: '#ff00c1' }}>
          <div className="terminal-header">
            <span style={{ color: '#ff00c1' }}>GİZLİ ARŞİV_DOSYASI_01</span>
          </div>
          <div className="terminal-body">
            <p style={{ color: '#ff00c1', fontWeight: 'bold' }}>[KRİTİK GÖREV]</p>
            <p>Evin ana kasasına erişmek için saatin mekanizması geçmişte tetiklenmelidir.</p>
            <p style={{ marginTop: '1rem' }}>Eski kayıtlara göre kilit zamanı: <span style={{ background: '#ff00c1', color: 'white', padding: '0 4px' }}>04:20</span></p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.7 }}>* Bu bilgiyi geçmişteki ortağına ilet.</p>
          </div>
        </div>

        <div className="terminal-window">
          <div className="terminal-header">
            <span>TERMINAL_COMMS</span>
            <span style={{ color: 'var(--future-accent)' }}>CONNECTED</span>
          </div>
          <div className="terminal-body" style={{ minHeight: '150px', maxHeight: '300px', overflowY: 'auto' }}>
            {incomingClues.filter(c => c.type === 'text').map((c, i) => (
              <p key={i} style={{ marginTop: '0.5rem' }}>
                <span style={{ color: '#ff00c1' }}>LEGACY_SIGNAL_{i}:</span> {c.value}
              </p>
            ))}
          </div>
          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(0,242,255,0.3)', paddingTop: '1rem' }}>
            <input 
              type="text" 
              placeholder="Geçmişe komut gönder..." 
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (sendClue('future-clue', terminalInput), setTerminalInput(''))}
              style={{ background: 'transparent', border: '1px solid var(--future-accent)', color: 'white', padding: '0.5rem', width: '70%' }}
            />
            <button onClick={() => {
              sendClue('future-clue', terminalInput);
              setTerminalInput('');
            }}>GÖNDER</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
