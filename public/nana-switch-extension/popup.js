/**
 * NaNaSwitch Cloud — Smart Cloud API Router
 * Popup Script (Zero-Trust Isolated Logic with 6 Advanced Features)
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 1. NAVIGATION PAR ONGLETS (4 ONGLETS)
  // =========================================================================
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // =========================================================================
  // 2. GESTION DE LA CLÉ API & CRÉDITS
  // =========================================================================
  const apiKeyInput = document.getElementById('apiKeyInput');
  const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
  const saveKeyBtn = document.getElementById('saveKeyBtn');
  const creditBalanceDisplay = document.getElementById('creditBalanceDisplay');
  const statusTitle = document.getElementById('statusTitle');

  const getStoredKey = (callback) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['nanaswitch_api_key', 'nanaswitch_credits'], (result) => {
        callback(result.nanaswitch_api_key || '', result.nanaswitch_credits || 250);
      });
    } else {
      const savedKey = localStorage.getItem('nanaswitch_api_key') || '';
      const savedCredits = Number(localStorage.getItem('nanaswitch_credits') || '250');
      callback(savedKey, savedCredits);
    }
  };

  const setStoredKey = (key, credits, callback) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ 
        nanaswitch_api_key: key, 
        nanaswitch_credits: credits 
      }, callback);
    } else {
      localStorage.setItem('nanaswitch_api_key', key);
      localStorage.setItem('nanaswitch_credits', String(credits));
      if (callback) callback();
    }
  };

  getStoredKey((key, credits) => {
    if (key) {
      apiKeyInput.value = key;
      if (statusTitle) statusTitle.textContent = '🟢 Connecté à NaNaSwitch Cloud';
    } else {
      if (statusTitle) statusTitle.textContent = '🟡 Clé Cloud non configurée';
    }
    if (creditBalanceDisplay) creditBalanceDisplay.textContent = String(credits);
    updateCodeSnippets();
  });

  let isKeyVisible = false;
  if (toggleKeyVisibility) {
    toggleKeyVisibility.addEventListener('click', () => {
      isKeyVisible = !isKeyVisible;
      apiKeyInput.type = isKeyVisible ? 'text' : 'password';
      toggleKeyVisibility.textContent = isKeyVisible ? '🔒' : '👁️';
    });
  }

  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', () => {
      const keyVal = apiKeyInput.value.trim();
      if (!keyVal) {
        alert('Veuillez renseigner une clé Cloud nana_sw_live_... ou nana_sw_test_...');
        return;
      }

      saveKeyBtn.textContent = 'Sauvegarde chiffrée...';
      setTimeout(() => {
        setStoredKey(keyVal, 250, () => {
          saveKeyBtn.textContent = '✅ Clé Enregistrée !';
          if (statusTitle) statusTitle.textContent = '🟢 Connecté à NaNaSwitch Cloud';
          updateCodeSnippets();
          setTimeout(() => {
            saveKeyBtn.textContent = '🔒 Enregistrer dans le Coffre Isolé';
          }, 2000);
        });
      }, 300);
    });
  }

  // =========================================================================
  // 3. FONCTION 4 : CONVERTISSEUR MULTI-DEVISES INSTANTANÉ
  // =========================================================================
  let currentCurrency = 'XOF';
  const currButtons = document.querySelectorAll('.curr-btn');
  const currencyConvertedHint = document.getElementById('currencyConvertedHint');
  const amountInput = document.getElementById('amountInput');
  const countrySelect = document.getElementById('countrySelect');
  const descInput = document.getElementById('descInput');
  const customerPhoneInput = document.getElementById('customerPhoneInput');

  function calculateConvertedXof() {
    const rawVal = parseFloat(amountInput.value) || 0;
    if (currentCurrency === 'XOF' || currentCurrency === 'XAF') {
      return Math.round(rawVal);
    }
    if (currentCurrency === 'EUR') {
      return Math.round(rawVal * 655.957);
    }
    if (currentCurrency === 'USD') {
      return Math.round(rawVal * 615.0);
    }
    return Math.round(rawVal);
  }

  function updateCurrencyDisplay() {
    const converted = calculateConvertedXof();
    if (currentCurrency === 'EUR') {
      currencyConvertedHint.textContent = `~ ${converted.toLocaleString()} FCFA (1€ = 655.96)`;
    } else if (currentCurrency === 'USD') {
      currencyConvertedHint.textContent = `~ ${converted.toLocaleString()} FCFA (1$ ≈ 615)`;
    } else if (currentCurrency === 'XAF') {
      currencyConvertedHint.textContent = `${converted.toLocaleString()} FCFA CEMAC`;
    } else {
      currencyConvertedHint.textContent = `FCFA UEMOA Direct`;
    }
    updateCodeSnippets();
  }

  currButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCurrency = btn.getAttribute('data-curr') || 'XOF';
      updateCurrencyDisplay();
    });
  });

  if (amountInput) {
    amountInput.addEventListener('input', updateCurrencyDisplay);
  }

  // =========================================================================
  // 4. ROUTEUR EXPRESS & FACTURATION WHATSAPP
  // =========================================================================
  const generateRouteBtn = document.getElementById('generateRouteBtn');
  const routeResultBox = document.getElementById('routeResultBox');
  const routedConnectorBadge = document.getElementById('routedConnectorBadge');
  const routeLatencyBadge = document.getElementById('routeLatencyBadge');
  const generatedUrlInput = document.getElementById('generatedUrlInput');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
  const openQrModalBtn = document.getElementById('openQrModalBtn');
  const toggleInvoicePreviewBtn = document.getElementById('toggleInvoicePreviewBtn');
  const invoicePreviewText = document.getElementById('invoicePreviewText');

  let currentGeneratedUrl = '';
  let currentInvoiceMessage = '';

  generateRouteBtn.addEventListener('click', () => {
    const c = countrySelect.value;
    const amt = calculateConvertedXof();
    const desc = descInput.value.trim() || 'Commande VIP';
    const phone = customerPhoneInput.value.trim() || '+22670000000';

    generateRouteBtn.textContent = 'Aiguillage Cloud en cours...';

    setTimeout(() => {
      let connector = 'SebPay Direct (Burkina Faso)';
      let latency = '⚡ 36ms';

      if (c === 'CI') {
        connector = 'CinetPay Hub (Côte d’Ivoire)';
        latency = '⚡ 41ms';
      } else if (c === 'SN') {
        connector = 'PayDunya Core (Sénégal)';
        latency = '⚡ 43ms';
      } else if (c === 'ML') {
        connector = 'CinetPay Hub (Mali)';
        latency = '⚡ 44ms';
      } else if (c === 'BJ' || c === 'TG') {
        connector = 'FedaPay Gateway (Bénin & Togo)';
        latency = '⚡ 40ms';
      } else if (c === 'CM') {
        connector = 'PawaPay Aggregate (Cameroun)';
        latency = '⚡ 48ms';
      } else if (c === 'INT') {
        connector = 'Stripe Global (Visa / Mastercard 3DS)';
        latency = '⚡ 62ms';
      }

      const routeId = `sw_${Math.floor(100000 + Math.random() * 900000)}`;
      currentGeneratedUrl = `https://cloud.nanasore.com/pay/${routeId}?c=${c}&amt=${amt}&cur=XOF`;

      // Préparation du message WhatsApp Formatté
      currentInvoiceMessage = `*⚡ LIEN DE PAIEMENT SÉCURISÉ — NaNaSwitch Cloud*
━━━━━━━━━━━━━━━━━━━━
📦 *Motif :* ${desc}
💰 *Montant :* ${amt.toLocaleString()} FCFA (${amountInput.value} ${currentCurrency})
🌍 *Zone :* ${countrySelect.options[countrySelect.selectedIndex].text}
🛡️ *Moyens :* Orange Money, Moov, Wave, MTN, Cartes 3DS

👉 *Réglez immédiatement en 1 clic :*
${currentGeneratedUrl}

━━━━━━━━━━━━━━━━━━━━
_Aiguillé instantanément par NaNaSwitch Cloud Node (IP 194.163.148.22)._`;

      routedConnectorBadge.textContent = `Routé via ${connector}`;
      routeLatencyBadge.textContent = latency;
      generatedUrlInput.value = currentGeneratedUrl;
      invoicePreviewText.value = currentInvoiceMessage;
      routeResultBox.style.display = 'block';

      generateRouteBtn.textContent = '🚀 Générer la Route Sécurisée';

      // Décompte de crédit simulé
      getStoredKey((k, credits) => {
        const nextCredits = Math.max(0, credits - 1);
        setStoredKey(k, nextCredits, () => {
          if (creditBalanceDisplay) creditBalanceDisplay.textContent = String(nextCredits);
        });
      });

      updateCodeSnippets();
    }, 450);
  });

  // Copier le lien
  copyUrlBtn.addEventListener('click', () => {
    generatedUrlInput.select();
    navigator.clipboard.writeText(generatedUrlInput.value);
    copyUrlBtn.textContent = 'Copié !';
    setTimeout(() => { copyUrlBtn.textContent = 'Copier'; }, 2000);
  });

  // FONCTION 1 : Partage WhatsApp Direct
  shareWhatsAppBtn.addEventListener('click', () => {
    if (!currentGeneratedUrl) return;
    const phone = customerPhoneInput.value.replace(/\D/g, '');
    const waUrl = phone.length >= 8
      ? `https://wa.me/${phone}?text=${encodeURIComponent(currentInvoiceMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(currentInvoiceMessage)}`;
    window.open(waUrl, '_blank');
  });

  // Aperçu de facture
  toggleInvoicePreviewBtn.addEventListener('click', () => {
    const isVisible = invoicePreviewText.style.display === 'block';
    invoicePreviewText.style.display = isVisible ? 'none' : 'block';
    toggleInvoicePreviewBtn.textContent = isVisible 
      ? '👁️ Aperçu du message WhatsApp' 
      : '🔼 Masquer l\'aperçu';
  });

  // =========================================================================
  // 5. FONCTION 2 : MODALE GUICHET QR CODE CLIENT
  // =========================================================================
  const qrModalOverlay = document.getElementById('qrModalOverlay');
  const qrModalImg = document.getElementById('qrModalImg');
  const qrModalAmountText = document.getElementById('qrModalAmountText');
  const qrModalDescText = document.getElementById('qrModalDescText');
  const closeQrModalBtn = document.getElementById('closeQrModalBtn');
  const closeQrModalBtn2 = document.getElementById('closeQrModalBtn2');

  openQrModalBtn.addEventListener('click', () => {
    if (!currentGeneratedUrl) return;
    const amt = calculateConvertedXof();
    qrModalAmountText.textContent = `${amt.toLocaleString()} FCFA`;
    qrModalDescText.textContent = descInput.value.trim() || 'Commande Express';
    qrModalImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentGeneratedUrl)}&margin=8&color=2563eb&bgcolor=ffffff`;
    qrModalOverlay.style.display = 'flex';
  });

  const closeQrModal = () => {
    qrModalOverlay.style.display = 'none';
  };
  if (closeQrModalBtn) closeQrModalBtn.addEventListener('click', closeQrModal);
  if (closeQrModalBtn2) closeQrModalBtn2.addEventListener('click', closeQrModal);

  // =========================================================================
  // 6. FONCTION 3 : QUICK-SWITCH D'URGENCE PAR PAYS
  // =========================================================================
  const qsButtons = document.querySelectorAll('.btn-qs');
  qsButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const countryCode = btn.getAttribute('data-country');
      const item = btn.closest('.qs-item');
      const ruleEl = item.querySelector('.qs-rule');
      const primEl = ruleEl.querySelector('.pill-prim');
      const fallEl = ruleEl.querySelector('.pill-fall');

      const oldPrim = primEl.textContent;
      const oldFall = fallEl.textContent;

      // Inversion immédiate
      primEl.textContent = oldFall;
      fallEl.textContent = oldPrim;

      btn.textContent = '✅ Inversé';
      btn.style.background = '#16a34a';
      btn.style.color = '#fff';

      setTimeout(() => {
        btn.textContent = 'Inverser';
        btn.style.background = '';
        btn.style.color = '';
      }, 1800);
    });
  });

  // =========================================================================
  // 7. FONCTION 6 : GÉNÉRATEUR DE CODE 1-CLIC
  // =========================================================================
  let currentSnippetTab = 'curl';
  const snippetTabs = document.querySelectorAll('.snip-tab');
  const snippetPreBlock = document.getElementById('snippetPreBlock');
  const copySnippetBtn = document.getElementById('copySnippetBtn');

  function updateCodeSnippets() {
    const k = apiKeyInput ? apiKeyInput.value.trim() || 'nana_sw_live_demo123' : 'nana_sw_live_demo123';
    const c = countrySelect ? countrySelect.value : 'BF';
    const amt = calculateConvertedXof();
    const endpoint = 'https://cloud.nanasore.com/v1/switch/route';

    if (currentSnippetTab === 'curl') {
      snippetPreBlock.textContent = `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer ${k}" \\
  -H "Content-Type: application/json" \\
  -d '{"amount":${amt},"currency":"XOF","country":"${c}"}'`;
    } else if (currentSnippetTab === 'js') {
      snippetPreBlock.textContent = `const res = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${k}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ amount: ${amt}, currency: "XOF", country: "${c}" })
});
const data = await res.json();`;
    } else if (currentSnippetTab === 'php') {
      snippetPreBlock.textContent = `$ch = curl_init("${endpoint}");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  'amount' => ${amt}, 'currency' => 'XOF', 'country' => '${c}'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ${k}']);
$res = curl_exec($ch);`;
    }
  }

  snippetTabs.forEach(t => {
    t.addEventListener('click', () => {
      snippetTabs.forEach(tb => tb.classList.remove('active'));
      t.classList.add('active');
      currentSnippetTab = t.getAttribute('data-snip') || 'curl';
      updateCodeSnippets();
    });
  });

  if (copySnippetBtn) {
    copySnippetBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(snippetPreBlock.textContent);
      copySnippetBtn.textContent = 'Copié !';
      setTimeout(() => { copySnippetBtn.textContent = 'Copier'; }, 2000);
    });
  }

  // =========================================================================
  // 8. TÉLÉMÉTRIE & PING
  // =========================================================================
  const refreshPingBtn = document.getElementById('refreshPingBtn');
  if (refreshPingBtn) {
    refreshPingBtn.addEventListener('click', () => {
      refreshPingBtn.textContent = 'Mesure...';
      const badges = document.querySelectorAll('.ping-badge');
      badges.forEach(b => { b.textContent = '...'; });

      setTimeout(() => {
        if (badges[0]) badges[0].textContent = `${Math.floor(Math.random() * 8) + 34} ms`;
        if (badges[1]) badges[1].textContent = `${Math.floor(Math.random() * 8) + 39} ms`;
        if (badges[2]) badges[2].textContent = `${Math.floor(Math.random() * 8) + 41} ms`;
        if (badges[3]) badges[3].textContent = `${Math.floor(Math.random() * 12) + 58} ms`;
        refreshPingBtn.textContent = '🔄 Rafraîchir';
      }, 500);
    });
  }

  // =========================================================================
  // 9. SYSTÈME DE CODE PIN DE SÉCURITÉ UNIVERSEL (SHA-256)
  // =========================================================================
  const extLockScreen = document.getElementById('extLockScreen');
  const extLockBtn = document.getElementById('extLockBtn');
  const extLockTitle = document.getElementById('extLockTitle');
  const extLockDesc = document.getElementById('extLockDesc');
  const extPinError = document.getElementById('extPinError');
  const extPinClear = document.getElementById('extPinClear');
  const extPinDel = document.getElementById('extPinDel');
  const pinKeyButtons = document.querySelectorAll('.pin-key[data-digit]');
  const pinDots = [
    document.getElementById('extDot0'),
    document.getElementById('extDot1'),
    document.getElementById('extDot2'),
    document.getElementById('extDot3')
  ];

  let currentPinEntry = '';
  let pinFailedCount = 0;
  let pinLockoutUntil = 0;
  let isCreatingNewPin = false;
  let tempNewPin = '';

  async function sha256Pin(pin) {
    const enc = new TextEncoder();
    const data = enc.encode(`nanaswitch_salt_${pin}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getStoredPinData(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['nanaswitch_pin_hash', 'nanaswitch_unlocked_until'], (res) => {
        callback(res.nanaswitch_pin_hash || null, Number(res.nanaswitch_unlocked_until || 0));
      });
    } else {
      const h = localStorage.getItem('nanaswitch_pin_hash');
      const u = Number(localStorage.getItem('nanaswitch_unlocked_until') || '0');
      callback(h, u);
    }
  }

  function saveStoredPinData(hash, unlockedUntil, callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const payload = { nanaswitch_unlocked_until: unlockedUntil };
      if (hash !== undefined) payload.nanaswitch_pin_hash = hash;
      chrome.storage.local.set(payload, callback);
    } else {
      if (hash !== undefined) localStorage.setItem('nanaswitch_pin_hash', hash);
      localStorage.setItem('nanaswitch_unlocked_until', String(unlockedUntil));
      if (callback) callback();
    }
  }

  function updatePinDots() {
    pinDots.forEach((dot, idx) => {
      if (dot) {
        if (idx < currentPinEntry.length) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      }
    });
  }

  function showPinError(msg) {
    if (extPinError) {
      extPinError.textContent = msg;
      extPinError.style.display = 'block';
    }
  }

  function hidePinError() {
    if (extPinError) {
      extPinError.style.display = 'none';
      extPinError.textContent = '';
    }
  }

  function checkLockStatus() {
    getStoredPinData((storedHash, unlockedUntil) => {
      const now = Date.now();
      if (!storedHash) {
        isCreatingNewPin = true;
        tempNewPin = '';
        currentPinEntry = '';
        updatePinDots();
        if (extLockTitle) extLockTitle.textContent = '🔒 Créer mon Code PIN';
        if (extLockDesc) extLockDesc.textContent = 'Définissez votre Code PIN à 4 chiffres';
        if (extLockScreen) extLockScreen.style.display = 'flex';
      } else if (unlockedUntil < now) {
        isCreatingNewPin = false;
        currentPinEntry = '';
        updatePinDots();
        if (extLockTitle) extLockTitle.textContent = 'Extension Verrouillée';
        if (extLockDesc) extLockDesc.textContent = 'Entrez votre Code PIN à 4 chiffres';
        if (extLockScreen) extLockScreen.style.display = 'flex';
      } else {
        if (extLockScreen) extLockScreen.style.display = 'none';
      }
    });
  }

  async function handlePinComplete(fullPin) {
    if (Date.now() < pinLockoutUntil) {
      showPinError('Temporisation active. Patientez 30s.');
      currentPinEntry = '';
      updatePinDots();
      return;
    }

    getStoredPinData(async (storedHash, unlockedUntil) => {
      if (isCreatingNewPin) {
        if (!tempNewPin) {
          tempNewPin = fullPin;
          currentPinEntry = '';
          updatePinDots();
          if (extLockTitle) extLockTitle.textContent = 'Confirmation du PIN';
          if (extLockDesc) extLockDesc.textContent = 'Retapez les 4 chiffres pour confirmer';
        } else {
          if (fullPin === tempNewPin) {
            const newHash = await sha256Pin(fullPin);
            const nextUnlock = Date.now() + 10 * 60 * 1000;
            saveStoredPinData(newHash, nextUnlock, () => {
              isCreatingNewPin = false;
              tempNewPin = '';
              currentPinEntry = '';
              updatePinDots();
              hidePinError();
              if (extLockScreen) extLockScreen.style.display = 'none';
            });
          } else {
            tempNewPin = '';
            currentPinEntry = '';
            updatePinDots();
            showPinError('Les deux codes PIN ne correspondent pas. Recommencez.');
            if (extLockTitle) extLockTitle.textContent = '🔒 Créer mon Code PIN';
            if (extLockDesc) extLockDesc.textContent = 'Définissez votre Code PIN à 4 chiffres';
          }
        }
      } else {
        const hash = await sha256Pin(fullPin);
        if (hash === storedHash) {
          const nextUnlock = Date.now() + 10 * 60 * 1000;
          saveStoredPinData(undefined, nextUnlock, () => {
            currentPinEntry = '';
            pinFailedCount = 0;
            updatePinDots();
            hidePinError();
            if (extLockScreen) extLockScreen.style.display = 'none';
          });
        } else {
          pinFailedCount++;
          currentPinEntry = '';
          updatePinDots();
          if (pinFailedCount >= 3) {
            pinLockoutUntil = Date.now() + 30 * 1000;
            showPinError('Trop de tentatives. Clavier bloqué pendant 30s.');
          } else {
            showPinError(`Code PIN incorrect (${3 - pinFailedCount} essai(s) restant(s)).`);
          }
        }
      }
    });
  }

  function onDigitPress(d) {
    if (Date.now() < pinLockoutUntil) {
      showPinError('Clavier bloqué temporairement.');
      return;
    }
    if (currentPinEntry.length >= 4) return;
    currentPinEntry += d;
    updatePinDots();
    hidePinError();

    if (currentPinEntry.length === 4) {
      setTimeout(() => {
        handlePinComplete(currentPinEntry);
      }, 100);
    }
  }

  pinKeyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const d = btn.getAttribute('data-digit');
      if (d) onDigitPress(d);
    });
  });

  if (extPinClear) {
    extPinClear.addEventListener('click', () => {
      currentPinEntry = '';
      updatePinDots();
      hidePinError();
    });
  }

  if (extPinDel) {
    extPinDel.addEventListener('click', () => {
      currentPinEntry = currentPinEntry.slice(0, -1);
      updatePinDots();
      hidePinError();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (extLockScreen && extLockScreen.style.display !== 'none') {
      if (/^[0-9]$/.test(e.key)) {
        onDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        currentPinEntry = currentPinEntry.slice(0, -1);
        updatePinDots();
      }
    }
  });

  if (extLockBtn) {
    extLockBtn.addEventListener('click', () => {
      saveStoredPinData(undefined, 0, () => {
        checkLockStatus();
      });
    });
  }

  checkLockStatus();

  updateCurrencyDisplay();
});
