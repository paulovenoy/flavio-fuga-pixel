/**
 * 01: Fuga de Brasília - Missão Mar-a-Lago (Edição Real-Time Online Leaderboard)
 * Core Arcade Game Engine with Pre-Game Name Selection, Continuous Auto-Fire & Global Real-Time Sync
 */

(function () {
  'use strict';

  // --- Constants & Config ---
  const CANVAS_WIDTH = 960;
  const CANVAS_HEIGHT = 540;
  const MAX_HEALTH = 3;
  const CLOUD_RANKING_TOPIC = "flavio-fuga-pixel-ranking-v1";
  const CLOUD_RANKING_URL = `https://ntfy.sh/${CLOUD_RANKING_TOPIC}`;

  // Stage Distances
  const STAGE_CONFIG = [
    { name: "FASE 1: O CERCO DE BRASÍLIA", distanceToBoss: 1200, totalDistance: 1400 },
    { name: "FASE 2: TRAVESSIA DO ATLÂNTICO", distanceToBoss: 9999, totalDistance: 1600 },
    { name: "FASE 3: POUSO EM MAR-A-LAGO", distanceToBoss: 9999, totalDistance: 1650 }
  ];

  // Meme Popups Bank
  const MEME_QUOTES = [
    "ADEUS PÁTRIA E FAMÍLIA, FUI!",
    "E O QUEIROZ?!",
    "FORO PRIVILEGIADO ATIVADO!",
    "DENTRO DAS 4 LINHAS!",
    "PERDEU, MANÉ, NÃO AMOLA!",
    "JOIAS DA ARÁBIA NO BAGAGEIRO!",
    "TREMENDOUS ESCAPE!",
    "CHOCOLATE DA KOPENHAGEN SALVO!",
    "INQUÉRITO BLOQUEADO!",
    "PATRIOTA DETECTADO NO RADAR!",
    "TROPA DO DANONE DESESPERADA!",
    "MAKE MAR-A-LAGO GREAT AGAIN!"
  ];

  // Janones Shouts
  const JANONES_QUOTES = [
    "URGENTE! ATENÇÃO BRASIL!",
    "MINHA TROPA VAI TE DERRUBAR!",
    "PRINT BOMBA DO QUEIROZ!",
    "DANONE NELES!",
    "CANCELEI O JATINHO 01!",
    "NÃO VAI PRA DISNEY NEM PRO TRUMP!"
  ];

  // Default Fallback Leaderboard
  const DEFAULT_LEADERBOARD = [
    { nick: "QUEIROZ_01", score: 99400, oranges: 82, stage: 3, date: "29/10", isOnline: true },
    { nick: "ALEXANDRE_X", score: 85200, oranges: 64, stage: 3, date: "29/10", isOnline: true },
    { nick: "CARLUXO_PIT", score: 71800, oranges: 51, stage: 2, date: "29/10", isOnline: true },
    { nick: "MARECHAL_DAN", score: 54200, oranges: 39, stage: 1, date: "29/10", isOnline: true },
    { nick: "PATRIOTA_CAM", score: 42100, oranges: 28, stage: 1, date: "29/10", isOnline: true }
  ];

  // Game States
  const STATE = {
    TITLE: 0,
    PLAYING: 1,
    STAGE_CLEAR: 2,
    GAMEOVER: 3,
    VICTORY: 4
  };

  class Game {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;

      this.screenWrapper = document.getElementById('screen-wrapper');
      this.memeToast = document.getElementById('meme-toast');
      this.takeoffBubble = document.getElementById('takeoff-bubble');
      this.takeoffQuote = document.getElementById('takeoff-quote');
      this.soundBtn = document.getElementById('btn-toggle-sound');
      this.soundIcon = document.getElementById('sound-icon');
      this.fullscreenBtn = document.getElementById('btn-fullscreen');
      this.container = document.getElementById('arcade-container');
      this.bossPill = document.getElementById('boss-pill');
      this.btnChangeNick = document.getElementById('btn-change-nick');
      this.displayNick = document.getElementById('display-nick');
      this.onlineStatus = document.getElementById('online-status');

      // Modals
      this.modalStartName = document.getElementById('modal-start-name');
      this.inputStartNick = document.getElementById('input-start-nick');
      this.btnConfirmStart = document.getElementById('btn-confirm-start');

      this.modalNick = document.getElementById('modal-nickname');
      this.inputNick = document.getElementById('input-nick');
      this.btnSaveNick = document.getElementById('btn-save-nick');
      this.btnCloseNick = document.getElementById('btn-close-nick');

      this.modalRanking = document.getElementById('modal-ranking');
      this.btnOpenRanking = document.getElementById('btn-open-ranking');
      this.btnCloseRanking = document.getElementById('btn-close-ranking');
      this.btnBackGame = document.getElementById('btn-back-game');
      this.btnShareScore = document.getElementById('btn-share-score');
      this.btnRefreshRanking = document.getElementById('btn-refresh-ranking');
      this.rankingTbody = document.getElementById('ranking-tbody');

      this.currentState = STATE.TITLE;
      this.currentStage = 1;
      this.lastTime = 0;
      this.score = 0;
      this.orangesCollected = 0;
      this.distanceInStage = 0;

      // Player Nickname (Mandatory before start)
      this.playerNick = localStorage.getItem('flavio_player_nick') || '';
      this.hasChosenName = false;
      this.updateNickUI();

      // High Score
      this.highScore = parseInt(localStorage.getItem('flavio_fuga_highscore') || '0', 10);

      // Global Live Leaderboard Array
      this.leaderboard = this.loadLocalLeaderboard();

      // Inputs
      this.keys = {};
      this.touchInput = { up: false, down: false, left: false, right: false, boost: false };
      this.touchDrag = { active: false, targetX: 0, targetY: 0 };

      // Continuous Auto-Fire State
      this.isShooting = false;
      this.shootCooldown = 0;

      // Player Object
      this.player = {
        x: 100,
        y: 220,
        w: 104,
        h: 42,
        speed: 6.2,
        health: MAX_HEALTH,
        invulnerableTimer: 0,
        passportShieldTimer: 0,
        turboMeter: 0,
        isTurboActive: false,
        turboDuration: 0,
        flameAnim: 0
      };

      // Boss: Marechal Janones
      this.boss = {
        active: false,
        defeated: false,
        x: CANVAS_WIDTH + 50,
        y: 180,
        w: 92,
        h: 60,
        vx: 0,
        vy: 3.2,
        maxHp: 40,
        hp: 40,
        attackTimer: 0,
        shoutTimer: 0,
        shoutText: "",
        isEnraged: false
      };

      // Collections
      this.projectiles = [];
      this.enemyProjectiles = [];
      this.obstacles = [];
      this.collectibles = [];
      this.particles = [];
      this.floatingTexts = [];
      this.lightningTelegraphs = [];

      // Timers
      this.spawnTimerObstacle = 0;
      this.spawnTimerCollectible = 0;
      this.memeTimer = 0;
      this.takeoffTimer = 0;
      this.lightningSpawnTimer = 0;
      this.lightningFlash = 0;

      // Parallax
      this.bgOffset1 = 0;
      this.bgOffset2 = 0;
      this.bgOffset3 = 0;

      // Victory cutscene
      this.victoryStep = 0;
      this.victoryTimer = 0;

      this.initEvents();
      this.updateSoundButtonUI();
      this.initRealtimeCloudLeaderboard();

      // Start loop
      requestAnimationFrame(this.loop.bind(this));
    }

    // --- Real-Time Online Backend (SSE + HTTP POST via ntfy.sh) ---

    initRealtimeCloudLeaderboard() {
      // 1. Fetch cached scores on start
      fetch(`${CLOUD_RANKING_URL}/json?poll=1`)
        .then(res => res.text())
        .then(text => {
          if (!text) return;
          const lines = text.trim().split('\n');
          lines.forEach(line => {
            try {
              const msgObj = JSON.parse(line);
              if (msgObj.message) {
                const data = typeof msgObj.message === 'string' ? JSON.parse(msgObj.message) : msgObj.message;
                this.mergeIntoLeaderboard(data, false);
              }
            } catch (err) {}
          });
          this.sortAndSaveLeaderboard();
        })
        .catch(err => {
          console.log("Leaderboard offline cache fallback active.");
        });

      // 2. Open Real-Time SSE Stream for live updates from other players
      try {
        const sse = new EventSource(`${CLOUD_RANKING_URL}/sse`);
        sse.onopen = () => {
          if (this.onlineStatus) {
            this.onlineStatus.textContent = "🟢 REAL-TIME ONLINE";
            this.onlineStatus.style.background = "#047857";
          }
        };

        sse.onmessage = (e) => {
          try {
            const parsed = JSON.parse(e.data);
            if (parsed.message) {
              const scoreObj = typeof parsed.message === 'string' ? JSON.parse(parsed.message) : parsed.message;
              if (scoreObj && scoreObj.nick && scoreObj.score) {
                this.mergeIntoLeaderboard(scoreObj, true);
                if (scoreObj.nick !== this.playerNick) {
                  this.showMemeToast(`📢 NOVO RECORDE: ${scoreObj.nick} fez ${scoreObj.score} pts!`);
                }
              }
            }
          } catch (err) {}
        };

        sse.onerror = () => {
          if (this.onlineStatus) {
            this.onlineStatus.textContent = "🟡 AUTO-SYNC PENDING";
          }
        };
      } catch (e) {}
    }

    broadcastScore(entry) {
      try {
        fetch(CLOUD_RANKING_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        }).catch(err => {});
      } catch (e) {}
    }

    mergeIntoLeaderboard(entry, triggerPulse = false) {
      if (!entry.nick || !entry.score) return;

      const existingIndex = this.leaderboard.findIndex(item => item.nick === entry.nick);
      if (existingIndex >= 0) {
        if (entry.score > this.leaderboard[existingIndex].score) {
          this.leaderboard[existingIndex] = { ...entry, isNew: triggerPulse, isOnline: true };
        }
      } else {
        this.leaderboard.push({ ...entry, isNew: triggerPulse, isOnline: true });
      }

      this.sortAndSaveLeaderboard();
      if (this.modalRanking && !this.modalRanking.classList.contains('hidden')) {
        this.renderRankingTable();
      }
    }

    sortAndSaveLeaderboard() {
      this.leaderboard.sort((a, b) => b.score - a.score);
      this.leaderboard = this.leaderboard.slice(0, 15);
      localStorage.setItem('flavio_leaderboard_v2', JSON.stringify(this.leaderboard));
    }

    loadLocalLeaderboard() {
      const saved = localStorage.getItem('flavio_leaderboard_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
      return [...DEFAULT_LEADERBOARD];
    }

    initEvents() {
      // Suggestion Chips Click
      document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const name = btn.getAttribute('data-name');
          if (this.inputStartNick) {
            this.inputStartNick.value = name;
            this.inputStartNick.focus();
          }
        });
      });

      // Confirm Pilot Name and Start
      if (this.btnConfirmStart) {
        this.btnConfirmStart.addEventListener('click', () => {
          this.confirmPilotNameAndDecolar();
        });
      }

      if (this.inputStartNick) {
        this.inputStartNick.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this.confirmPilotNameAndDecolar();
          }
        });
      }

      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        if (window.sound) window.sound.init();
        this.keys[e.code] = true;

        if (e.code === 'KeyM') this.toggleSound();
        if (e.code === 'KeyF') this.toggleFullscreen();
        if (e.code === 'KeyR') this.openRankingModal();

        if (e.code === 'Space') {
          this.isShooting = true;
          if (this.currentState === STATE.TITLE) {
            if (!this.hasChosenName) {
              this.openStartNameModal();
            } else {
              this.startStage(1);
            }
          } else if (this.currentState === STATE.STAGE_CLEAR) {
            this.startStage(this.currentStage + 1);
          } else if (this.currentState === STATE.GAMEOVER || this.currentState === STATE.VICTORY) {
            this.startStage(1);
          }
        }

        if (this.currentState === STATE.PLAYING) {
          if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyB') {
            this.activateTurbo();
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
        if (e.code === 'Space') {
          this.isShooting = false;
        }
      });

      // Sound button
      this.soundBtn.addEventListener('click', () => {
        if (window.sound) window.sound.init();
        this.toggleSound();
      });

      // Fullscreen button
      if (this.fullscreenBtn) {
        this.fullscreenBtn.addEventListener('click', () => {
          this.toggleFullscreen();
        });
      }

      // Ranking modal buttons
      this.btnOpenRanking.addEventListener('click', () => this.openRankingModal());
      this.btnCloseRanking.addEventListener('click', () => this.closeRankingModal());
      this.btnBackGame.addEventListener('click', () => this.closeRankingModal());
      this.btnShareScore.addEventListener('click', () => this.shareScoreCard());
      if (this.btnRefreshRanking) {
        this.btnRefreshRanking.addEventListener('click', () => {
          this.initRealtimeCloudLeaderboard();
          this.renderRankingTable();
          this.showMemeToast("🔄 RANKING ATUALIZADO VIA CLOUD!");
        });
      }

      // Nickname change button
      this.btnChangeNick.addEventListener('click', () => this.openNickModal());
      this.btnSaveNick.addEventListener('click', () => this.saveNick());
      this.btnCloseNick.addEventListener('click', () => this.closeNickModal());

      // Canvas click to advance
      this.canvas.addEventListener('click', () => {
        if (window.sound) window.sound.init();
        if (this.currentState === STATE.TITLE) {
          if (!this.hasChosenName) {
            this.openStartNameModal();
          } else {
            this.startStage(1);
          }
        } else if (this.currentState === STATE.STAGE_CLEAR) {
          this.startStage(this.currentStage + 1);
        } else if (this.currentState === STATE.GAMEOVER || this.currentState === STATE.VICTORY) {
          this.startStage(1);
        }
      });

      this.setupTouchControls();
      this.setupDirectTouchDrag();
    }

    setupTouchControls() {
      const shootBtn = document.getElementById('touch-shoot');
      if (shootBtn) {
        const startShoot = (e) => {
          e.preventDefault();
          if (window.sound) window.sound.init();
          this.isShooting = true;
          if (this.currentState === STATE.TITLE) {
            if (!this.hasChosenName) this.openStartNameModal();
            else this.startStage(1);
          }
          if (this.currentState === STATE.STAGE_CLEAR) this.startStage(this.currentStage + 1);
          if (this.currentState === STATE.GAMEOVER || this.currentState === STATE.VICTORY) this.startStage(1);
        };
        const endShoot = (e) => {
          e.preventDefault();
          this.isShooting = false;
        };

        shootBtn.addEventListener('touchstart', startShoot, { passive: false });
        shootBtn.addEventListener('touchend', endShoot, { passive: false });
        shootBtn.addEventListener('mousedown', startShoot);
        shootBtn.addEventListener('mouseup', endShoot);
      }

      const bindTouch = (id, keyName, isAction = false) => {
        const btn = document.getElementById(id);
        if (!btn) return;

        const start = (e) => {
          e.preventDefault();
          if (window.sound) window.sound.init();
          this.touchInput[keyName] = true;
          if (isAction && keyName === 'boost' && this.currentState === STATE.PLAYING) {
            this.activateTurbo();
          }
        };

        const end = (e) => {
          e.preventDefault();
          this.touchInput[keyName] = false;
        };

        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', end, { passive: false });
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', end);
      };

      bindTouch('touch-up', 'up');
      bindTouch('touch-down', 'down');
      bindTouch('touch-left', 'left');
      bindTouch('touch-right', 'right');
      bindTouch('touch-boost', 'boost', true);
    }

    setupDirectTouchDrag() {
      const getPos = (touch) => {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY
        };
      };

      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          const pos = getPos(e.touches[0]);
          if (pos.x < CANVAS_WIDTH * 0.75) {
            this.touchDrag.active = true;
            this.touchDrag.targetX = pos.x;
            this.touchDrag.targetY = pos.y;
          }
        }
      }, { passive: false });

      this.canvas.addEventListener('touchmove', (e) => {
        if (this.touchDrag.active && e.touches.length > 0) {
          const pos = getPos(e.touches[0]);
          this.touchDrag.targetX = pos.x;
          this.touchDrag.targetY = pos.y;
        }
      }, { passive: false });

      const endTouch = () => {
        this.touchDrag.active = false;
      };

      this.canvas.addEventListener('touchend', endTouch);
      this.canvas.addEventListener('touchcancel', endTouch);
    }

    // --- Pre-Game Pilot Selection Modal ---

    openStartNameModal() {
      if (!this.modalStartName) return;
      this.inputStartNick.value = this.playerNick || '01_FLAVIO';
      this.modalStartName.classList.remove('hidden');
      setTimeout(() => this.inputStartNick.focus(), 100);
    }

    confirmPilotNameAndDecolar() {
      let val = this.inputStartNick.value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
      if (val.length === 0) val = '01_FLAVIO';

      this.playerNick = val.substring(0, 12);
      this.hasChosenName = true;
      localStorage.setItem('flavio_player_nick', this.playerNick);
      this.updateNickUI();

      if (this.modalStartName) {
        this.modalStartName.classList.add('hidden');
      }

      this.startStage(1);
    }

    updateNickUI() {
      if (this.displayNick) {
        this.displayNick.textContent = this.playerNick || 'ESCOLHER';
      }
    }

    openNickModal() {
      if (this.modalNick) {
        this.inputNick.value = this.playerNick;
        this.modalNick.classList.remove('hidden');
        this.inputNick.focus();
      }
    }

    closeNickModal() {
      if (this.modalNick) {
        this.modalNick.classList.add('hidden');
      }
    }

    saveNick() {
      const val = this.inputNick.value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
      if (val.length > 0) {
        this.playerNick = val.substring(0, 12);
        localStorage.setItem('flavio_player_nick', this.playerNick);
        this.updateNickUI();
        this.showMemeToast(`NOME ATUALIZADO: ${this.playerNick}!`);
      }
      this.closeNickModal();
    }

    openRankingModal() {
      if (!this.modalRanking) return;
      this.renderRankingTable();
      this.modalRanking.classList.remove('hidden');
    }

    closeRankingModal() {
      if (this.modalRanking) {
        this.modalRanking.classList.add('hidden');
      }
    }

    renderRankingTable() {
      if (!this.rankingTbody) return;
      this.rankingTbody.innerHTML = '';

      const medals = ['🥇', '🥈', '🥉'];
      this.leaderboard.forEach((item, idx) => {
        const tr = document.createElement('tr');
        if (item.nick === this.playerNick) {
          tr.classList.add('highlight-player');
        }
        if (item.isNew) {
          tr.classList.add('row-new');
        }

        const medal = idx < 3 ? medals[idx] : `#${idx + 1}`;
        const onlineTag = item.isOnline ? `<span class="badge-live">ONLINE</span>` : `<span style="color:#64748b">LOCAL</span>`;

        tr.innerHTML = `
          <td><strong>${medal}</strong></td>
          <td>${item.nick}</td>
          <td><strong>${item.score.toLocaleString()}</strong></td>
          <td>🍊 ${item.oranges}</td>
          <td>FASE ${item.stage}</td>
          <td>${onlineTag}</td>
        `;
        this.rankingTbody.appendChild(tr);
      });
    }

    shareScoreCard() {
      const text = `✈️ 01: Fuga de Brasília - Missão Mar-a-Lago!\nO piloto ${this.playerNick} atingiu ${this.score.toLocaleString()} pts e coletou ${this.orangesCollected} laranjas na Fase ${this.currentStage}!\nJogue e dispute o Ranking Global Real-Time em: https://paulovenoy.github.io/flavio-fuga-pixel/`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.showMemeToast("📋 RECORDE COPIADO PARA O CLIPBOARD!");
        });
      }
    }

    triggerScreenShake() {
      if (!this.screenWrapper) return;
      this.screenWrapper.classList.remove('screen-shake');
      void this.screenWrapper.offsetWidth;
      this.screenWrapper.classList.add('screen-shake');
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        if (this.container.requestFullscreen) {
          this.container.requestFullscreen();
        } else if (this.container.webkitRequestFullscreen) {
          this.container.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }

    toggleSound() {
      const isMuted = window.sound.toggleMute();
      this.updateSoundButtonUI();
    }

    updateSoundButtonUI() {
      const muted = window.sound ? window.sound.muted : false;
      if (this.soundIcon) {
        this.soundIcon.textContent = muted ? '🔇 SOM: MUDO' : '🔊 SOM: ON';
      }
      if (this.soundBtn) {
        this.soundBtn.style.borderColor = muted ? '#ef4444' : '#00f2fe';
        this.soundBtn.style.color = muted ? '#ef4444' : '#00f2fe';
      }
    }

    showMemeToast(text) {
      if (!this.memeToast) return;
      this.memeToast.textContent = text;
      this.memeToast.classList.remove('hidden');
      setTimeout(() => {
        this.memeToast.classList.add('hidden');
      }, 2300);
    }

    showTakeoffBubble() {
      if (!this.takeoffBubble) return;
      if (this.takeoffQuote) {
        this.takeoffQuote.textContent = `"${this.playerNick}: ADEUS PÁTRIA E FAMÍLIA, FUI!" 🇧🇷💨`;
      }
      this.takeoffBubble.classList.remove('hidden');
      this.takeoffTimer = 220;
    }

    startStage(stageNum) {
      if (stageNum > 3) {
        this.triggerVictory();
        return;
      }

      this.currentStage = stageNum;
      this.currentState = STATE.PLAYING;
      this.distanceInStage = 0;
      this.player.health = MAX_HEALTH;
      this.player.x = 80;
      this.player.y = 220;
      this.player.turboMeter = 0;
      this.player.isTurboActive = false;
      this.player.passportShieldTimer = 0;
      this.player.invulnerableTimer = 0;

      this.boss.active = false;
      this.boss.defeated = false;
      this.boss.hp = this.boss.maxHp;
      this.boss.isEnraged = false;
      this.boss.x = CANVAS_WIDTH + 60;

      this.obstacles = [];
      this.collectibles = [];
      this.projectiles = [];
      this.enemyProjectiles = [];
      this.particles = [];
      this.floatingTexts = [];
      this.lightningTelegraphs = [];

      window.sound.startBGM('normal');

      if (this.currentStage === 1) {
        this.showTakeoffBubble();
        this.showMemeToast(`🚀 PILOTO ${this.playerNick} DECOLANDO!`);
        if (this.bossPill) this.bossPill.textContent = "BOSS: MARECHAL JANONES";
      } else if (this.currentStage === 2) {
        this.showMemeToast("🌊 FASE 2: TRAVESSIA DO ATLÂNTICO! CUIDADO COM OS RAIOS!");
        if (this.bossPill) this.bossPill.textContent = "HAZARD: RELÂMPAGOS & FAB";
      } else if (this.currentStage === 3) {
        this.showMemeToast("🌴 FASE 3: ESPAÇO AÉREO DA FLÓRIDA! RUMO AO TRUMP!");
        if (this.bossPill) this.bossPill.textContent = "OBJETIVO: POUSO EM MAR-A-LAGO";
      }
    }

    // --- Continuous Auto-Fire Engine ---

    handleContinuousFire() {
      if (!this.isShooting || this.currentState !== STATE.PLAYING) return;

      this.shootCooldown--;
      const fireInterval = this.player.isTurboActive ? 4 : 7;

      if (this.shootCooldown <= 0) {
        this.shootCooldown = fireInterval;
        this.fireOrangeBullet();
      }
    }

    fireOrangeBullet() {
      const noseX = this.player.x + this.player.w - 6;
      const noseY = this.player.y + this.player.h / 2 - 4;

      this.projectiles.push({
        x: noseX,
        y: noseY + (Math.random() - 0.5) * 4,
        vx: this.player.isTurboActive ? 16 : 13,
        vy: (Math.random() - 0.5) * 1.5,
        w: 22,
        h: 22,
        rot: 0,
        isGolden: this.player.isTurboActive
      });

      window.sound.playShoot();
      this.createPuff(this.player.x, this.player.y + this.player.h / 2, this.player.isTurboActive ? '#facc15' : '#fdba74');
    }

    activateTurbo() {
      if (this.player.turboMeter >= 100 && !this.player.isTurboActive) {
        this.player.isTurboActive = true;
        this.player.turboDuration = 240;
        this.player.turboMeter = 0;
        window.sound.playTurbo();
        this.triggerScreenShake();
        this.showMemeToast("⚡ SUPER RACHADINHA TURBO ATIVADO!");
      }
    }

    createPuff(x, y, color = '#ffffff') {
      for (let i = 0; i < 4; i++) {
        this.particles.push({
          x: x,
          y: y,
          vx: -3 - Math.random() * 4,
          vy: (Math.random() - 0.5) * 2,
          size: 3 + Math.random() * 4,
          color: color,
          life: 18,
          maxLife: 18
        });
      }
    }

    createExplosion(x, y, colorPalette = ['#f59e0b', '#ef4444', '#fde047', '#ffffff']) {
      this.triggerScreenShake();
      for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 6,
          color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
          life: 25 + Math.random() * 20,
          maxLife: 45
        });
      }
    }

    createMoneySparks(x, y) {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: x,
          y: y + (Math.random() - 0.5) * 20,
          vx: -6 - Math.random() * 4,
          vy: (Math.random() - 0.5) * 3,
          size: 7,
          isCash: true,
          life: 30,
          maxLife: 30
        });
      }
    }

    addFloatingText(x, y, text, color = '#facc15') {
      this.floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 50,
        vy: -1.2
      });
    }

    // --- Harder Difficulty Spawners ---

    spawnObstacle() {
      if (this.boss.active && !this.boss.defeated) return;

      const yPos = 40 + Math.random() * (CANVAS_HEIGHT - 130);

      if (this.currentStage === 1) {
        const types = ['drone', 'gavel', 'ankle'];
        const chosen = types[Math.floor(Math.random() * types.length)];

        if (chosen === 'drone') {
          this.obstacles.push({
            type: 'drone',
            x: CANVAS_WIDTH + 20,
            y: yPos,
            w: 48,
            h: 24,
            vx: -4.5,
            baseY: yPos,
            shootTimer: 55 + Math.random() * 45,
            hp: 2
          });
        } else if (chosen === 'gavel') {
          this.obstacles.push({
            type: 'gavel',
            x: CANVAS_WIDTH + 20,
            y: yPos,
            w: 38,
            h: 30,
            vx: -6.0,
            baseY: yPos,
            hp: 1
          });
        } else {
          this.obstacles.push({
            type: 'ankle',
            x: CANVAS_WIDTH + 20,
            y: yPos,
            w: 44,
            h: 18,
            vx: -4.8,
            baseY: yPos,
            hp: 1
          });
        }
      } else if (this.currentStage === 2) {
        const types = ['fabJet', 'patriota', 'gavel'];
        const chosen = types[Math.floor(Math.random() * types.length)];

        if (chosen === 'fabJet') {
          this.obstacles.push({
            type: 'fabJet',
            x: CANVAS_WIDTH + 40,
            y: yPos,
            w: 65,
            h: 28,
            vx: -7.0,
            shootTimer: 60,
            hp: 4
          });
        } else if (chosen === 'patriota') {
          this.obstacles.push({
            type: 'patriota',
            x: CANVAS_WIDTH + 40,
            y: yPos,
            w: 56,
            h: 30,
            vx: -8.0,
            hp: 3
          });
        } else {
          this.obstacles.push({
            type: 'gavel',
            x: CANVAS_WIDTH + 20,
            y: yPos,
            w: 38,
            h: 30,
            vx: -6.5,
            baseY: yPos,
            hp: 1
          });
        }
      } else if (this.currentStage === 3) {
        const types = ['drone', 'fabJet', 'patriota'];
        const chosen = types[Math.floor(Math.random() * types.length)];
        this.obstacles.push({
          type: chosen,
          x: CANVAS_WIDTH + 30,
          y: yPos,
          w: chosen === 'fabJet' ? 65 : 50,
          h: 28,
          vx: -6.2,
          hp: 3
        });
      }
    }

    spawnCollectible() {
      const rand = Math.random();
      const yPos = 40 + Math.random() * (CANVAS_HEIGHT - 110);

      if (rand < 0.55) {
        this.collectibles.push({
          type: 'orange',
          x: CANVAS_WIDTH + 20,
          y: yPos,
          w: 28,
          h: 28,
          vx: -3.5,
          points: 100
        });
      } else if (rand < 0.80) {
        this.collectibles.push({
          type: 'chocolate',
          x: CANVAS_WIDTH + 20,
          y: yPos,
          w: 35,
          h: 28,
          vx: -3.5,
          points: 300
        });
      } else if (rand < 0.93) {
        this.collectibles.push({
          type: 'picanha',
          x: CANVAS_WIDTH + 20,
          y: yPos,
          w: 34,
          h: 24,
          vx: -3.8,
          points: 400
        });
      } else if (rand < 0.98) {
        this.collectibles.push({
          type: 'passport',
          x: CANVAS_WIDTH + 20,
          y: yPos,
          w: 32,
          h: 28,
          vx: -4.0,
          points: 500
        });
      } else {
        this.collectibles.push({
          type: 'joias',
          x: CANVAS_WIDTH + 20,
          y: yPos,
          w: 36,
          h: 30,
          vx: -4.5,
          points: 1000
        });
      }
    }

    // --- Stage 2 Lightning System ---

    spawnLightningHazard() {
      const targetX = 80 + Math.random() * (CANVAS_WIDTH - 200);
      this.lightningTelegraphs.push({
        x: targetX,
        w: 32,
        timer: 45,
        activeStrike: false,
        strikeDuration: 14
      });
    }

    updateLightningHazards() {
      for (let i = this.lightningTelegraphs.length - 1; i >= 0; i--) {
        const bolt = this.lightningTelegraphs[i];
        if (!bolt.activeStrike) {
          bolt.timer--;
          if (bolt.timer <= 0) {
            bolt.activeStrike = true;
            window.sound.playHit();
            this.triggerScreenShake();
            this.lightningFlash = 5;
          }
        } else {
          bolt.strikeDuration--;
          if (
            this.player.x + this.player.w > bolt.x &&
            this.player.x < bolt.x + bolt.w
          ) {
            this.hitPlayer("Raio da Tempestade Atlântica!");
          }

          if (bolt.strikeDuration <= 0) {
            this.lightningTelegraphs.splice(i, 1);
          }
        }
      }
    }

    // --- Boss AI: Marechal Janones ---

    triggerJanonesBoss() {
      this.boss.active = true;
      this.boss.defeated = false;
      this.boss.x = CANVAS_WIDTH - 150;
      this.boss.y = 150;
      this.boss.hp = this.boss.maxHp;
      this.boss.isEnraged = false;
      this.boss.attackTimer = 30;
      this.boss.shoutTimer = 0;
      this.boss.shoutText = "ATENÇÃO BRASIL! VOU DERRUBAR O 01!";

      window.sound.startBGM('boss');
      window.sound.playMegaphoneSiren();
      this.triggerScreenShake();
      this.showMemeToast("🚨 ALERTA: MARECHAL JANONES ATACA COM O EXÉRCITO DO LULA!");
    }

    updateJanonesBoss() {
      if (!this.boss.active || this.boss.defeated) return;

      if (this.boss.hp <= this.boss.maxHp / 2 && !this.boss.isEnraged) {
        this.boss.isEnraged = true;
        this.boss.vy = 4.2;
        this.showMemeToast("🔥 JANONES ENFURECIDO: 'TROPA DO DANONE ATACAR!'");
        window.sound.playMegaphoneSiren();
      }

      this.boss.y += this.boss.vy;
      if (this.boss.y < 50) {
        this.boss.y = 50;
        this.boss.vy = Math.abs(this.boss.vy);
      } else if (this.boss.y > CANVAS_HEIGHT - 140) {
        this.boss.y = CANVAS_HEIGHT - 140;
        this.boss.vy = -Math.abs(this.boss.vy);
      }

      this.boss.shoutTimer++;
      if (this.boss.shoutTimer > 140) {
        this.boss.shoutTimer = 0;
        this.boss.shoutText = JANONES_QUOTES[Math.floor(Math.random() * JANONES_QUOTES.length)];
        window.sound.playMegaphoneSiren();
      }

      this.boss.attackTimer++;
      const attackThreshold = this.boss.isEnraged ? 35 : 48;
      if (this.boss.attackTimer > attackThreshold) {
        this.boss.attackTimer = 0;

        window.sound.playTweetChime();
        this.enemyProjectiles.push({
          type: 'print',
          x: this.boss.x - 15,
          y: this.boss.y + 10,
          vx: -8.5,
          vy: -1.0,
          w: 36,
          h: 20
        });
        this.enemyProjectiles.push({
          type: 'print',
          x: this.boss.x - 15,
          y: this.boss.y + 30,
          vx: -8.5,
          vy: 1.0,
          w: 36,
          h: 20
        });

        if (Math.random() < 0.6) {
          window.sound.playDanoneSplash();
          this.enemyProjectiles.push({
            type: 'danone',
            x: this.boss.x - 10,
            y: this.boss.y + 20,
            vx: -7.0,
            vy: (this.player.y - this.boss.y) * 0.025,
            w: 24,
            h: 20
          });
        }
      }

      for (let j = this.projectiles.length - 1; j >= 0; j--) {
        const proj = this.projectiles[j];
        if (this.checkCollision(proj, this.boss)) {
          this.boss.hp -= (proj.isGolden ? 2 : 1);
          this.projectiles.splice(j, 1);
          this.createPuff(proj.x, proj.y, '#f97316');
          window.sound.playHit();

          if (this.boss.hp <= 0) {
            this.defeatJanones();
            break;
          }
        }
      }

      if (this.checkCollision(this.player, this.boss)) {
        if (this.player.isTurboActive || this.player.passportShieldTimer > 0) {
          this.boss.hp -= 4;
          window.sound.playHit();
          this.createExplosion(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2);
          if (this.boss.hp <= 0) {
            this.defeatJanones();
          }
        } else {
          this.hitPlayer("Colisão com o Palanque do Janones!");
        }
      }
    }

    defeatJanones() {
      this.boss.defeated = true;
      this.boss.active = false;
      this.createExplosion(this.boss.x + 40, this.boss.y + 30, ['#ef4444', '#ffd700', '#22c55e', '#fff']);
      window.sound.playHit();
      window.sound.playStageClear();

      this.score += 2500;
      this.showMemeToast("💥 JANONES DERROTADO: 'FUI DESMENTIDO NO TWITTER!'");

      for (let i = 0; i < 10; i++) {
        this.collectibles.push({
          type: 'orange',
          x: this.boss.x + (Math.random() - 0.5) * 70,
          y: this.boss.y + (Math.random() - 0.5) * 70,
          w: 28,
          h: 28,
          vx: -2.5 - Math.random() * 2,
          points: 100
        });
      }
      this.collectibles.push({
        type: 'joias',
        x: this.boss.x + 30,
        y: this.boss.y,
        w: 36,
        h: 30,
        vx: -2.5,
        points: 1000
      });

      setTimeout(() => {
        this.triggerStageClear();
      }, 2500);
    }

    triggerStageClear() {
      this.currentState = STATE.STAGE_CLEAR;
      window.sound.stopBGM();
      window.sound.playStageClear();
      this.score += 1500;
      this.recordAndBroadcastCurrentScore();
    }

    // --- Main Game Update Loop ---

    update(dt) {
      if (this.currentState === STATE.TITLE) {
        this.bgOffset1 -= 0.5;
        this.bgOffset2 -= 1.0;
        return;
      }

      if (this.currentState === STATE.VICTORY) {
        this.updateVictoryCutscene(dt);
        return;
      }

      if (this.currentState === STATE.STAGE_CLEAR || this.currentState === STATE.GAMEOVER) {
        return;
      }

      if (this.takeoffTimer > 0) {
        this.takeoffTimer--;
        if (this.takeoffTimer <= 0 && this.takeoffBubble) {
          this.takeoffBubble.classList.add('hidden');
        }
      }

      this.handleContinuousFire();

      const flightSpeed = this.player.isTurboActive ? 5.5 : 2.8;
      this.distanceInStage += flightSpeed;
      this.score += Math.round(flightSpeed * 0.7);

      const cfg = STAGE_CONFIG[this.currentStage - 1];

      if (this.currentStage === 1 && this.distanceInStage >= cfg.distanceToBoss && !this.boss.active && !this.boss.defeated) {
        this.triggerJanonesBoss();
      }

      if (this.currentStage === 2 && this.distanceInStage >= cfg.totalDistance) {
        this.triggerStageClear();
        return;
      } else if (this.currentStage === 3 && this.distanceInStage >= cfg.totalDistance) {
        this.triggerVictory();
        return;
      }

      this.bgOffset1 -= flightSpeed * 0.3;
      this.bgOffset2 -= flightSpeed * 0.8;
      this.bgOffset3 -= flightSpeed * 1.8;

      if (this.currentStage === 2) {
        this.lightningSpawnTimer++;
        if (this.lightningSpawnTimer > 180) {
          this.lightningSpawnTimer = 0;
          this.spawnLightningHazard();
        }
        this.updateLightningHazards();
        if (this.lightningFlash > 0) this.lightningFlash--;
      }

      let moveX = 0;
      let moveY = 0;

      if (this.keys['KeyW'] || this.keys['ArrowUp'] || this.touchInput.up) moveY -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown'] || this.touchInput.down) moveY += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.touchInput.left) moveX -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight'] || this.touchInput.right) moveX += 1;

      if (this.touchDrag.active) {
        const dx = (this.touchDrag.targetX - 45) - this.player.x;
        const dy = (this.touchDrag.targetY - 20) - this.player.y;
        if (Math.abs(dx) > 6) moveX = Math.sign(dx);
        if (Math.abs(dy) > 6) moveY = Math.sign(dy);
      }

      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }

      const currentSpeed = this.player.isTurboActive ? this.player.speed * 1.6 : this.player.speed;
      this.player.x += moveX * currentSpeed;
      this.player.y += moveY * currentSpeed;

      this.player.x = Math.max(15, Math.min(CANVAS_WIDTH - this.player.w - 30, this.player.x));
      this.player.y = Math.max(30, Math.min(CANVAS_HEIGHT - this.player.h - 35, this.player.y));

      if (this.player.invulnerableTimer > 0) this.player.invulnerableTimer--;
      if (this.player.passportShieldTimer > 0) this.player.passportShieldTimer--;

      if (this.player.isTurboActive) {
        this.player.turboDuration--;
        this.createMoneySparks(this.player.x, this.player.y + this.player.h / 2);
        if (this.player.turboDuration <= 0) {
          this.player.isTurboActive = false;
        }
      }

      this.player.flameAnim = (this.player.flameAnim + 1) % 6;
      if (Math.random() < 0.7) {
        this.createPuff(
          this.player.x - 6,
          this.player.y + this.player.h / 2 + 5,
          this.player.isTurboActive ? '#facc15' : '#38bdf8'
        );
      }

      // Update projectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.rot += 0.25;
        if (p.x > CANVAS_WIDTH + 50) {
          this.projectiles.splice(i, 1);
        }
      }

      // Update enemy projectiles
      for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
        const ep = this.enemyProjectiles[i];
        ep.x += ep.vx;
        ep.y += ep.vy;

        if (this.checkCollision(ep, this.player)) {
          this.enemyProjectiles.splice(i, 1);
          this.hitPlayer(ep.type === 'print' ? "Atingido por Print do Janones!" : "Atingido por Ataque Opositor!");
          continue;
        }

        if (ep.x < -40) {
          this.enemyProjectiles.splice(i, 1);
        }
      }

      this.updateJanonesBoss();

      // Obstacles
      this.spawnTimerObstacle++;
      const spawnInterval = Math.max(35, 90 - this.currentStage * 14);
      if (this.spawnTimerObstacle > spawnInterval) {
        this.spawnTimerObstacle = 0;
        this.spawnObstacle();
      }

      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.x += obs.vx;

        if (obs.type === 'drone' || obs.type === 'gavel' || obs.type === 'ankle') {
          obs.y = obs.baseY + Math.sin(Date.now() / 240 + obs.x * 0.05) * 28;
        }

        if (obs.shootTimer !== undefined) {
          obs.shootTimer--;
          if (obs.shootTimer <= 0) {
            obs.shootTimer = 75 + Math.random() * 40;
            this.enemyProjectiles.push({
              type: 'laser',
              x: obs.x - 10,
              y: obs.y + obs.h / 2,
              vx: -8.0,
              vy: 0,
              w: 14,
              h: 6
            });
          }
        }

        for (let j = this.projectiles.length - 1; j >= 0; j--) {
          const proj = this.projectiles[j];
          if (this.checkCollision(proj, obs)) {
            obs.hp -= (proj.isGolden ? 2 : 1);
            this.projectiles.splice(j, 1);
            this.createPuff(proj.x, proj.y, '#f97316');

            if (obs.hp <= 0) {
              window.sound.playHit();
              this.createExplosion(obs.x + obs.w / 2, obs.y + obs.h / 2);
              this.score += 250;
              this.addFloatingText(obs.x, obs.y, "+250", "#22c55e");
              this.obstacles.splice(i, 1);
              break;
            }
          }
        }

        if (obs && this.checkCollision(obs, this.player)) {
          if (this.player.isTurboActive || this.player.passportShieldTimer > 0) {
            window.sound.playHit();
            this.createExplosion(obs.x + obs.w / 2, obs.y + obs.h / 2);
            this.score += 300;
            this.addFloatingText(obs.x, obs.y, "ATROPELADO! +300", "#fde047");
            this.obstacles.splice(i, 1);
          } else {
            this.hitPlayer(obs.type === 'fabJet' ? "Interceptado pela FAB!" : "Colisão Policial!");
            this.obstacles.splice(i, 1);
          }
        }

        if (obs && obs.x < -100) {
          this.obstacles.splice(i, 1);
        }
      }

      // Collectibles
      this.spawnTimerCollectible++;
      if (this.spawnTimerCollectible > 80) {
        this.spawnTimerCollectible = 0;
        this.spawnCollectible();
      }

      for (let i = this.collectibles.length - 1; i >= 0; i--) {
        const c = this.collectibles[i];
        c.x += c.vx;

        if (this.checkCollision(c, this.player)) {
          if (c.type === 'orange') {
            window.sound.playOrangePickup();
            this.score += c.points;
            this.orangesCollected++;
            this.player.turboMeter = Math.min(100, this.player.turboMeter + 16);
            this.addFloatingText(c.x, c.y, "+100 LARANJA", "#f97316");
          } else if (c.type === 'chocolate') {
            window.sound.playChocPickup();
            this.score += c.points;
            if (this.player.health < MAX_HEALTH) {
              this.player.health++;
              this.addFloatingText(c.x, c.y, "+1 VIDA! KOPENHAGEN", "#e879f9");
            } else {
              this.player.turboMeter = Math.min(100, this.player.turboMeter + 35);
              this.addFloatingText(c.x, c.y, "+300 CHOCOLATE", "#e879f9");
            }
          } else if (c.type === 'picanha') {
            window.sound.playChocPickup();
            this.score += c.points;
            this.player.turboMeter = Math.min(100, this.player.turboMeter + 40);
            this.addFloatingText(c.x, c.y, "+400 PICANHA!", "#ef4444");
          } else if (c.type === 'passport') {
            window.sound.playPassportImmunity();
            this.score += c.points;
            this.player.passportShieldTimer = 360;
            this.showMemeToast("🛡️ FORO PRIVILEGIADO: IMUNIDADE TOTAL!");
            this.addFloatingText(c.x, c.y, "IMUNIDADE! +500", "#38bdf8");
          } else if (c.type === 'joias') {
            window.sound.playPassportImmunity();
            this.score += c.points;
            this.player.turboMeter = 100;
            this.showMemeToast("💎 JOIAS DAS ARÁBIAS! SUPER TURBO LIBERADO!");
            this.addFloatingText(c.x, c.y, "JOIAS SAUDITAS! +1000", "#ffd700");
          }

          this.collectibles.splice(i, 1);
          continue;
        }

        if (c.x < -50) {
          this.collectibles.splice(i, 1);
        }
      }

      this.memeTimer++;
      if (this.memeTimer > 380) {
        this.memeTimer = 0;
        const quote = MEME_QUOTES[Math.floor(Math.random() * MEME_QUOTES.length)];
        this.showMemeToast(quote);
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        if (pt.life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy;
        ft.life--;
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }
    }

    hitPlayer(reason) {
      if (this.player.invulnerableTimer > 0 || this.player.passportShieldTimer > 0 || this.player.isTurboActive) {
        return;
      }

      this.player.health--;
      this.player.invulnerableTimer = 85;
      window.sound.playHit();
      this.triggerScreenShake();
      this.createExplosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, ['#ef4444', '#fff']);

      if (this.player.health <= 0) {
        this.triggerGameOver(reason);
      } else {
        this.showMemeToast("⚠️ DANO NO JATINHO! FORO AMEAÇADO!");
      }
    }

    recordAndBroadcastCurrentScore() {
      const now = new Date();
      const dateStr = `${now.getDate()}/${now.getMonth() + 1}`;
      const entry = {
        nick: this.playerNick,
        score: this.score,
        oranges: this.orangesCollected,
        stage: this.currentStage,
        date: dateStr,
        isOnline: true
      };

      this.mergeIntoLeaderboard(entry, false);
      this.broadcastScore(entry);
    }

    triggerGameOver(reason) {
      this.currentState = STATE.GAMEOVER;
      this.isShooting = false;
      window.sound.stopBGM();
      window.sound.playGameOver();

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('flavio_fuga_highscore', this.highScore);
      }

      this.recordAndBroadcastCurrentScore();
      this.showMemeToast("🚨 PRESO PELA PF! O VOO CAIU!");
    }

    triggerVictory() {
      this.currentState = STATE.VICTORY;
      this.isShooting = false;
      this.victoryStep = 0;
      this.victoryTimer = 0;
      window.sound.stopBGM();
      window.sound.playVictory();

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('flavio_fuga_highscore', this.highScore);
      }

      this.recordAndBroadcastCurrentScore();
      this.showMemeToast("🇺🇸 POUSO EM MAR-A-LAGO! BEM-VINDO, 01!");
    }

    updateVictoryCutscene(dt) {
      this.victoryTimer++;
      if (this.victoryTimer > 180 && this.victoryStep === 0) {
        this.victoryStep = 1;
      } else if (this.victoryTimer > 360 && this.victoryStep === 1) {
        this.victoryStep = 2;
      }

      if (Math.random() < 0.45) {
        this.particles.push({
          x: Math.random() * CANVAS_WIDTH,
          y: -10,
          vx: (Math.random() - 0.5) * 2,
          vy: 2 + Math.random() * 3,
          size: 4 + Math.random() * 5,
          color: ['#ffd700', '#22c55e', '#ef4444', '#00f2fe', '#fff'][Math.floor(Math.random() * 5)],
          life: 120,
          maxLife: 120
        });
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        if (pt.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }

    checkCollision(a, b) {
      return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
      );
    }

    // --- Rendering Pipelines ---

    draw() {
      this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (this.currentState === STATE.TITLE) {
        this.drawTitleScreen();
      } else if (this.currentState === STATE.PLAYING) {
        this.drawBackground();
        this.drawEntities();
        this.drawHUD();
      } else if (this.currentState === STATE.STAGE_CLEAR) {
        this.drawBackground();
        this.drawStageClearScreen();
      } else if (this.currentState === STATE.GAMEOVER) {
        this.drawBackground();
        this.drawEntities();
        this.drawGameOverScreen();
      } else if (this.currentState === STATE.VICTORY) {
        this.drawVictoryScreen();
      }
    }

    drawBackground() {
      const grad = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);

      if (this.currentStage === 1) {
        grad.addColorStop(0, '#1e3a8a');
        grad.addColorStop(0.4, '#0284c7');
        grad.addColorStop(0.8, '#f97316');
        grad.addColorStop(1, '#ca8a04');
      } else if (this.currentStage === 2) {
        grad.addColorStop(0, '#020617');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(0.85, '#1e1b4b');
        grad.addColorStop(1, '#0c4a6e');
      } else {
        grad.addColorStop(0, '#4a044e');
        grad.addColorStop(0.4, '#c026d3');
        grad.addColorStop(0.75, '#fb923c');
        grad.addColorStop(1, '#065f46');
      }

      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (this.lightningFlash > 0) {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.18})`;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      this.drawParallaxLayer(this.bgOffset1);
      this.drawGround();
      this.drawClouds(this.bgOffset2);
    }

    drawParallaxLayer(offset) {
      const w = 150;
      const count = Math.ceil(CANVAS_WIDTH / w) + 2;
      const startX = (offset % w) - w;

      if (this.currentStage === 1) {
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        for (let i = 0; i < count; i++) {
          const x = startX + i * w;
          this.ctx.beginPath();
          this.ctx.arc(x + 40, CANVAS_HEIGHT - 65, 34, Math.PI, 0);
          this.ctx.arc(x + 105, CANVAS_HEIGHT - 38, 28, 0, Math.PI);
          this.ctx.fill();
          this.ctx.fillRect(x + 65, CANVAS_HEIGHT - 110, 16, 75);
        }
      } else if (this.currentStage === 3) {
        this.ctx.fillStyle = 'rgba(74, 4, 78, 0.5)';
        for (let i = 0; i < count; i++) {
          const x = startX + i * w;
          this.ctx.fillRect(x + 20, CANVAS_HEIGHT - 140, 35, 100);
          this.ctx.fillRect(x + 70, CANVAS_HEIGHT - 170, 25, 130);
          this.ctx.fillRect(x + 110, CANVAS_HEIGHT - 120, 30, 80);
        }
      }
    }

    drawGround() {
      if (this.currentStage === 2) {
        this.ctx.fillStyle = '#082f49';
        this.ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

        this.ctx.fillStyle = '#38bdf8';
        const waveOffset = (this.distanceInStage * 3) % 40;
        for (let x = -waveOffset; x < CANVAS_WIDTH + 40; x += 35) {
          this.ctx.fillRect(x, CANVAS_HEIGHT - 48, 20, 3);
          this.ctx.fillRect(x + 10, CANVAS_HEIGHT - 35, 16, 3);
        }
      } else {
        this.ctx.fillStyle = this.currentStage === 1 ? '#15803d' : '#047857';
        this.ctx.fillRect(0, CANVAS_HEIGHT - 44, CANVAS_WIDTH, 44);

        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillRect(0, CANVAS_HEIGHT - 44, CANVAS_WIDTH, 4);
      }
    }

    drawClouds(offset) {
      this.ctx.fillStyle = this.currentStage === 2 ? 'rgba(71, 85, 105, 0.55)' : 'rgba(255, 255, 255, 0.45)';
      const cloudW = 240;
      const count = Math.ceil(CANVAS_WIDTH / cloudW) + 2;
      const startX = (offset % cloudW) - cloudW;

      for (let i = 0; i < count; i++) {
        const x = startX + i * cloudW;
        const y = 45 + (i % 3) * 38;
        this.ctx.beginPath();
        this.ctx.arc(x + 35, y, 22, 0, Math.PI * 2);
        this.ctx.arc(x + 65, y - 8, 30, 0, Math.PI * 2);
        this.ctx.arc(x + 100, y, 24, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    drawEntities() {
      for (const bolt of this.lightningTelegraphs) {
        if (!bolt.activeStrike) {
          this.ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
          this.ctx.fillRect(bolt.x, 0, bolt.w, CANVAS_HEIGHT);
          this.ctx.strokeStyle = '#facc15';
          this.ctx.strokeRect(bolt.x, 0, bolt.w, CANVAS_HEIGHT);
        } else {
          this.ctx.fillStyle = '#ffffff';
          this.ctx.fillRect(bolt.x + 4, 0, bolt.w - 8, CANVAS_HEIGHT);
          this.ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
          this.ctx.fillRect(bolt.x, 0, bolt.w, CANVAS_HEIGHT);
        }
      }

      for (const c of this.collectibles) {
        if (c.type === 'orange') {
          this.ctx.drawImage(window.sprites.getOrange(), c.x, c.y);
        } else if (c.type === 'chocolate') {
          this.ctx.drawImage(window.sprites.getChocolate(), c.x, c.y);
        } else if (c.type === 'passport') {
          this.ctx.drawImage(window.sprites.getPassport(), c.x, c.y);
        } else if (c.type === 'picanha') {
          this.ctx.drawImage(window.sprites.getPicanha(), c.x, c.y);
        } else if (c.type === 'joias') {
          this.ctx.drawImage(window.sprites.getJoiasArabia(), c.x, c.y);
        }
      }

      for (const obs of this.obstacles) {
        if (obs.type === 'drone') {
          this.ctx.drawImage(window.sprites.getPfDrone(), obs.x, obs.y);
        } else if (obs.type === 'gavel') {
          this.ctx.drawImage(window.sprites.getGavelToga(), obs.x, obs.y);
        } else if (obs.type === 'patriota') {
          this.ctx.drawImage(window.sprites.getPatriotaCaminhao(), obs.x, obs.y);
        } else if (obs.type === 'ankle') {
          this.ctx.drawImage(window.sprites.getAnkleMonitor(), obs.x, obs.y);
        } else if (obs.type === 'fabJet') {
          this.ctx.drawImage(window.sprites.getFabJet(), obs.x, obs.y);
        }
      }

      if (this.boss.active && !this.boss.defeated) {
        this.ctx.drawImage(window.sprites.getMarechalJanones(), this.boss.x, this.boss.y);

        if (this.boss.shoutText) {
          const sx = this.boss.x - 220;
          const sy = this.boss.y - 25;
          this.ctx.fillStyle = '#ffffff';
          this.ctx.strokeStyle = '#dc2626';
          this.ctx.lineWidth = 2;
          this.ctx.fillRect(sx, sy, 210, 32);
          this.ctx.strokeRect(sx, sy, 210, 32);

          this.ctx.font = '7.5px "Press Start 2P", monospace';
          this.ctx.fillStyle = '#b91c1c';
          this.ctx.fillText(this.boss.shoutText, sx + 8, sy + 19);
        }
      }

      for (const p of this.projectiles) {
        this.ctx.save();
        this.ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        this.ctx.rotate(p.rot);
        this.ctx.drawImage(window.sprites.getOrange(), -p.w / 2, -p.h / 2, p.w, p.h);

        if (p.isGolden) {
          this.ctx.strokeStyle = '#ffd700';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        this.ctx.restore();
      }

      for (const ep of this.enemyProjectiles) {
        if (ep.type === 'print') {
          this.ctx.drawImage(window.sprites.getPrintTweet(), ep.x, ep.y);
        } else if (ep.type === 'danone') {
          this.ctx.drawImage(window.sprites.getDanoneCup(), ep.x, ep.y);
        } else {
          this.ctx.fillStyle = '#ef4444';
          this.ctx.fillRect(ep.x, ep.y, ep.w, ep.h);
          this.ctx.fillStyle = '#fee2e2';
          this.ctx.fillRect(ep.x + 2, ep.y + 1, ep.w - 4, ep.h - 2);
        }
      }

      if (this.player.invulnerableTimer % 6 < 3) {
        this.ctx.save();

        if (this.keys['KeyW'] || this.keys['ArrowUp'] || this.touchInput.up) {
          this.ctx.translate(this.player.x, this.player.y);
          this.ctx.rotate(-0.06);
          this.ctx.translate(-this.player.x, -this.player.y);
        } else if (this.keys['KeyS'] || this.keys['ArrowDown'] || this.touchInput.down) {
          this.ctx.translate(this.player.x, this.player.y);
          this.ctx.rotate(0.06);
          this.ctx.translate(-this.player.x, -this.player.y);
        }

        this.ctx.drawImage(window.sprites.getFlavioJet(), this.player.x, this.player.y);

        if (this.player.passportShieldTimer > 0) {
          this.ctx.strokeStyle = '#38bdf8';
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.ellipse(
            this.player.x + this.player.w / 2,
            this.player.y + this.player.h / 2,
            this.player.w * 0.65,
            this.player.h * 0.9,
            0,
            0,
            Math.PI * 2
          );
          this.ctx.stroke();
        }

        if (this.player.isTurboActive) {
          this.ctx.strokeStyle = '#facc15';
          this.ctx.lineWidth = 4;
          this.ctx.strokeRect(this.player.x - 4, this.player.y - 4, this.player.w + 8, this.player.h + 8);
        }

        this.ctx.restore();
      }

      for (const pt of this.particles) {
        if (pt.isCash) {
          this.ctx.fillStyle = '#0284c7';
          this.ctx.fillRect(pt.x, pt.y, 16, 9);
          this.ctx.fillStyle = '#bae6fd';
          this.ctx.fillRect(pt.x + 3, pt.y + 2, 9, 5);
        } else {
          this.ctx.fillStyle = pt.color;
          this.ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        }
      }

      for (const ft of this.floatingTexts) {
        this.ctx.font = '10px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
        this.ctx.fillStyle = ft.color;
        this.ctx.fillText(ft.text, ft.x, ft.y);
      }
    }

    // --- HUD ---

    drawHUD() {
      this.ctx.fillStyle = 'rgba(10, 15, 30, 0.88)';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, 38);
      this.ctx.strokeStyle = '#25283d';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(0, 0, CANVAS_WIDTH, 38);

      this.ctx.font = '10px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#facc15';
      this.ctx.fillText(`PTS:${this.score.toString().padStart(6, '0')}`, 16, 24);

      this.ctx.fillStyle = '#f97316';
      this.ctx.fillText(`🍊x${this.orangesCollected}`, 190, 24);

      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.fillText("JATO:", 295, 24);
      for (let i = 0; i < MAX_HEALTH; i++) {
        if (i < this.player.health) {
          this.ctx.fillStyle = '#ef4444';
          this.ctx.fillText("♥", 360 + i * 18, 24);
        } else {
          this.ctx.fillStyle = '#475569';
          this.ctx.fillText("♡", 360 + i * 18, 24);
        }
      }

      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.fillText("RACHADINHA:", 440, 24);

      this.ctx.fillStyle = '#1e293b';
      this.ctx.fillRect(570, 12, 110, 16);
      this.ctx.strokeStyle = this.player.turboMeter >= 100 ? '#facc15' : '#64748b';
      this.ctx.strokeRect(570, 12, 110, 16);

      if (this.player.isTurboActive) {
        this.ctx.fillStyle = '#eab308';
        const pct = this.player.turboDuration / 240;
        this.ctx.fillRect(572, 14, 106 * pct, 12);
      } else {
        this.ctx.fillStyle = this.player.turboMeter >= 100 ? '#f59e0b' : '#38bdf8';
        this.ctx.fillRect(572, 14, 106 * (this.player.turboMeter / 100), 12);
      }

      const cfg = STAGE_CONFIG[this.currentStage - 1];
      const progress = Math.min(1, this.distanceInStage / cfg.totalDistance);

      const barX = 710;
      const barY = 12;
      const barW = 230;

      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(barX, barY, barW, 16);
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.strokeRect(barX, barY, barW, 16);

      this.ctx.fillStyle = '#059669';
      this.ctx.fillRect(barX + 2, barY + 2, (barW - 4) * progress, 12);

      this.ctx.font = '8px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(`FASE ${this.currentStage} ✈ ${Math.floor(progress * 100)}%`, barX + 60, barY + 12);

      if (this.boss.active && !this.boss.defeated) {
        const bossBarW = 340;
        const bossBarX = CANVAS_WIDTH / 2 - bossBarW / 2;
        const bossBarY = 48;

        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        this.ctx.fillRect(bossBarX - 10, bossBarY - 4, bossBarW + 20, 26);
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.strokeRect(bossBarX - 10, bossBarY - 4, bossBarW + 20, 26);

        this.ctx.fillStyle = this.boss.isEnraged ? '#ef4444' : '#dc2626';
        const hpPct = Math.max(0, this.boss.hp / this.boss.maxHp);
        this.ctx.fillRect(bossBarX, bossBarY, bossBarW * hpPct, 16);

        this.ctx.font = '8px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(
          `BOSS: MARECHAL JANONES ${this.boss.isEnraged ? '🔥 [FÚRIA]' : ''} [${this.boss.hp}/${this.boss.maxHp}]`,
          bossBarX + 10,
          bossBarY + 12
        );
      }
    }

    // --- Title Screen with Live Leaderboard Ticker ---

    drawTitleScreen() {
      const grad = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#1e3a8a');
      grad.addColorStop(1, '#0284c7');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      this.drawClouds(this.bgOffset1);

      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      this.ctx.strokeStyle = '#ffd700';
      this.ctx.lineWidth = 4;
      this.ctx.fillRect(70, 30, CANVAS_WIDTH - 140, CANVAS_HEIGHT - 60);
      this.ctx.strokeRect(70, 30, CANVAS_WIDTH - 140, CANVAS_HEIGHT - 60);

      this.ctx.font = '24px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#ffd700';
      this.ctx.textAlign = 'center';
      this.ctx.fillText("01: FUGA DE BRASÍLIA", CANVAS_WIDTH / 2, 80);

      this.ctx.font = '10px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#00f2fe';
      this.ctx.fillText('"ADEUS PÁTRIA E FAMÍLIA, FUI!"', CANVAS_WIDTH / 2, 106);

      const jet = window.sprites.getFlavioJet();
      this.ctx.drawImage(jet, CANVAS_WIDTH / 2 - 130, 125, 140, 58);

      const janones = window.sprites.getMarechalJanones();
      this.ctx.drawImage(janones, CANVAS_WIDTH / 2 + 50, 120, 80, 55);

      // Live Global Podium Preview Box
      this.ctx.fillStyle = '#1e243d';
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 1;
      this.ctx.fillRect(CANVAS_WIDTH / 2 - 250, 205, 500, 75);
      this.ctx.strokeRect(CANVAS_WIDTH / 2 - 250, 205, 500, 75);

      this.ctx.font = '8px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#ffd700';
      this.ctx.fillText("🌐 TOP 3 DO RANKING GLOBAL AO VIVO:", CANVAS_WIDTH / 2, 222);

      const top3 = this.leaderboard.slice(0, 3);
      top3.forEach((item, i) => {
        const medal = ['🥇', '🥈', '🥉'][i];
        this.ctx.fillStyle = i === 0 ? '#ffd700' : (i === 1 ? '#e2e8f0' : '#fb923c');
        this.ctx.fillText(
          `${medal} ${item.nick.padEnd(12, ' ')} : ${item.score.toLocaleString()} PTS (Fase ${item.stage})`,
          CANVAS_WIDTH / 2,
          240 + i * 14
        );
      });

      // Controls Note
      this.ctx.font = '8px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.fillText("Pilote com W/A/S/D ou Toque & Arraste no celular!", CANVAS_WIDTH / 2, 310);
      this.ctx.fillText("Segure ESPAÇO ou o botão p/ AUTO-DISPARO CONTÍNUO 🍊", CANVAS_WIDTH / 2, 330);

      if (Math.floor(Date.now() / 400) % 2 === 0) {
        this.ctx.font = '13px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillText("[ CLIQUE OU PRESSIONE ESPAÇO P/ ESCOLHER NOME ]", CANVAS_WIDTH / 2, 385);
      }

      this.ctx.font = '8.5px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.fillText(`PILOTO CONECTADO: ${this.playerNick || 'NÃO DEFINIDO'}`, CANVAS_WIDTH / 2, 425);
      this.ctx.textAlign = 'left';
    }

    // --- Stage Clear Screen ---

    drawStageClearScreen() {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      this.ctx.textAlign = 'center';
      this.ctx.font = '22px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#22c55e';
      this.ctx.fillText(`🎉 FASE ${this.currentStage} CONCLUÍDA! 🎉`, CANVAS_WIDTH / 2, 140);

      this.ctx.font = '11px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#fde047';
      if (this.currentStage === 1) {
        this.ctx.fillText("Marechal Janones foi derrubado! Brasília ficou para trás!", CANVAS_WIDTH / 2, 180);
      } else if (this.currentStage === 2) {
        this.ctx.fillText("Você sobreviveu à tempestade! Espaço aéreo dos EUA liberado!", CANVAS_WIDTH / 2, 180);
      }

      this.ctx.fillStyle = '#1e293b';
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 2;
      this.ctx.fillRect(CANVAS_WIDTH / 2 - 200, 210, 400, 120);
      this.ctx.strokeRect(CANVAS_WIDTH / 2 - 200, 210, 400, 120);

      this.ctx.font = '10px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#facc15';
      this.ctx.fillText(`PILOTO: ${this.playerNick}`, CANVAS_WIDTH / 2, 240);

      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(`PONTUAÇÃO ATUAL: ${this.score}`, CANVAS_WIDTH / 2, 268);

      this.ctx.fillStyle = '#f97316';
      this.ctx.fillText(`LARANJAS: ${this.orangesCollected} | BÔNUS: +1500 PTS`, CANVAS_WIDTH / 2, 298);

      if (Math.floor(Date.now() / 400) % 2 === 0) {
        this.ctx.font = '12px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillText("[ AVANÇAR PARA A PRÓXIMA FASE (ESPAÇO/TOQUE) ]", CANVAS_WIDTH / 2, 385);
      }
      this.ctx.textAlign = 'left';
    }

    // --- Game Over Screen ---

    drawGameOverScreen() {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      this.ctx.textAlign = 'center';
      this.ctx.font = '24px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#ef4444';
      this.ctx.fillText("🚨 MANDADO CUMPRIDO! 🚨", CANVAS_WIDTH / 2, 130);

      this.ctx.font = '12px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#f87171';
      this.ctx.fillText("A Polícia Federal interceptou o Voo 01!", CANVAS_WIDTH / 2, 170);

      this.ctx.fillStyle = '#1e293b';
      this.ctx.strokeStyle = '#475569';
      this.ctx.lineWidth = 2;
      this.ctx.fillRect(CANVAS_WIDTH / 2 - 200, 205, 400, 130);
      this.ctx.strokeRect(CANVAS_WIDTH / 2 - 200, 205, 400, 130);

      this.ctx.font = '10px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillText(`PILOTO: ${this.playerNick}`, CANVAS_WIDTH / 2, 235);

      this.ctx.fillStyle = '#facc15';
      this.ctx.fillText(`PONTUAÇÃO: ${this.score}`, CANVAS_WIDTH / 2, 265);

      this.ctx.fillStyle = '#f97316';
      this.ctx.fillText(`LARANJAS: ${this.orangesCollected}  |  FASE ${this.currentStage}`, CANVAS_WIDTH / 2, 295);

      if (Math.floor(Date.now() / 400) % 2 === 0) {
        this.ctx.font = '12px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillText("[ TENTAR NOVAMENTE (ESPAÇO/TOQUE) ]", CANVAS_WIDTH / 2, 385);
      }
      this.ctx.textAlign = 'left';
    }

    // --- Victory Screen & Cutscene ---

    drawVictoryScreen() {
      const grad = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#be185d');
      grad.addColorStop(0.5, '#fb923c');
      grad.addColorStop(1, '#064e3b');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const mansion = window.sprites.getMansion();
      this.ctx.drawImage(mansion, CANVAS_WIDTH / 2 - 230, CANVAS_HEIGHT - 250, 460, 200);

      this.ctx.fillStyle = '#15803d';
      this.ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

      this.ctx.strokeStyle = '#facc15';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.ellipse(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 38, 120, 28, 0, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.font = '16px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#ffd700';
      this.ctx.textAlign = 'center';
      this.ctx.fillText("H", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);

      this.ctx.drawImage(window.sprites.getFlavioJet(), CANVAS_WIDTH / 2 - 220, CANVAS_HEIGHT - 105, 130, 54);

      const trumpY = CANVAS_HEIGHT - 118 + Math.sin(Date.now() / 150) * 4;
      this.ctx.drawImage(window.sprites.getTrump(), CANVAS_WIDTH / 2 + 70, trumpY, 65, 75);

      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      this.ctx.strokeStyle = '#facc15';
      this.ctx.lineWidth = 3;
      this.ctx.fillRect(CANVAS_WIDTH / 2 - 280, 20, 560, 60);
      this.ctx.strokeRect(CANVAS_WIDTH / 2 - 280, 20, 560, 60);

      this.ctx.font = '15px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#facc15';
      this.ctx.fillText("🏆 POUSO EM MAR-A-LAGO! 🏆", CANVAS_WIDTH / 2, 45);

      this.ctx.font = '8.5px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillText("MISSÃO CUMPRIDA: O VOO MAIS TREMENDO DA HISTÓRIA!", CANVAS_WIDTH / 2, 65);

      const bubbleX = CANVAS_WIDTH / 2 - 270;
      const bubbleY = 95;
      const bubbleW = 540;
      const bubbleH = 85;

      this.ctx.fillStyle = '#ffffff';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 3;
      this.ctx.fillRect(bubbleX, bubbleY, bubbleW, bubbleH);
      this.ctx.strokeRect(bubbleX, bubbleY, bubbleW, bubbleH);

      this.ctx.font = '8.5px "Press Start 2P", monospace';
      this.ctx.textAlign = 'left';

      if (this.victoryStep === 0) {
        this.ctx.fillStyle = '#1e3a8a';
        this.ctx.fillText(`TRUMP: 'Flavio! Or should I say Pilot ${this.playerNick}!'`, bubbleX + 15, bubbleY + 25);
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillText("'He said: \"ADEUS PÁTRIA E FAMÍLIA, FUI!\" Absolutely legendary!'", bubbleX + 15, bubbleY + 45);
        this.ctx.fillStyle = '#dc2626';
        this.ctx.fillText("'Marechal Janones and his prints were totally crushed!'", bubbleX + 15, bubbleY + 65);
      } else if (this.victoryStep === 1) {
        this.ctx.fillStyle = '#15803d';
        this.ctx.fillText("FLÁVIO: 'Valeu, Mr. President! Trouxe as laranjas,'", bubbleX + 15, bubbleY + 25);
        this.ctx.fillText("'a caixa de bombom, as joias sauditas e o Queiroz mandou um abraço!'", bubbleX + 15, bubbleY + 45);
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillText("'Aqui em Mar-a-Lago o foro é privilegiado de verdade!'", bubbleX + 15, bubbleY + 65);
      } else {
        this.ctx.fillStyle = '#d97706';
        this.ctx.fillText("TRUMP: 'Now let's drink diet cokes, play golf and rally!'", bubbleX + 15, bubbleY + 25);
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillText("'Make Mar-a-Lago Great Again!'", bubbleX + 15, bubbleY + 45);
        this.ctx.fillStyle = '#15803d';
        this.ctx.fillText(`PILOTO ${this.playerNick}: ${this.score} PTS | ${this.orangesCollected} LARANJAS`, bubbleX + 15, bubbleY + 65);
      }

      for (const pt of this.particles) {
        this.ctx.fillStyle = pt.color;
        this.ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      }

      if (Math.floor(Date.now() / 400) % 2 === 0) {
        this.ctx.textAlign = 'center';
        this.ctx.font = '11px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillText("[ JOGAR NOVAMENTE (ESPAÇO OU TOQUE) ]", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
      }
      this.ctx.textAlign = 'left';
    }

    // --- Main Loop ---

    loop(timestamp) {
      if (!this.lastTime) this.lastTime = timestamp;
      const dt = timestamp - this.lastTime;
      this.lastTime = timestamp;

      this.update(dt);
      this.draw();

      requestAnimationFrame(this.loop.bind(this));
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
  });
})();
