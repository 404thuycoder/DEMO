"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('aiPlannerForm');
  var btn = document.getElementById('generateBtn');
  var placeholder = document.getElementById('resultPlaceholder');
  var loader = document.getElementById('aiLoader');
  var resultContainer = document.getElementById('timelineResult');
  var refineBox = document.getElementById('refineBox');
  var refineForm = document.getElementById('refineForm');
  var refineInput = document.getElementById('refineInput');
  var refineBtn = document.getElementById('refineBtn');
  var timelineContent = document.getElementById('timelineContent');
  var versionTabs = document.getElementById('versionTabs');
  var btnSaveTrip = document.getElementById('btnSaveTrip');
  var btnStartNav = document.getElementById('btnStartNav');
  var saveTripStatus = document.getElementById('saveTripStatus');

  // Lưu trữ Lịch sử phiên bản
  var planHistory = [];
  var currentPlanIndex = -1;
  var currentItineraryId = null;

  // ---- Chế độ Xem Lịch Trình (từ My Trips) ----
  var urlParams = new URLSearchParams(window.location.search);
  var viewModeHeader = document.getElementById('viewModeHeader');
  if (urlParams.get('view') === 'true') {
    var stored = sessionStorage.getItem('wander_view_trip');
    if (stored) {
      try {
        var plan = JSON.parse(stored);
        // sessionStorage.removeItem('wander_view_trip'); // Keep it during the session in case of refresh
        planHistory.push(plan);
        currentPlanIndex = 0;

        // Hiện header chế độ xem và ẩn form tạo mới
        viewModeHeader.style.display = 'flex';
        form.closest('.planner-form-card').style.display = 'none';
        renderVersionTabs();
        renderItinerary(plan, plan.destination || '', '');
        resultContainer.style.display = 'block';
        refineBox.style.display = 'block';
        placeholder.style.display = 'none';
        resetSaveButton();
        // Ẩn nút Lưu vì user đã lưu rồi mới xem 
        btnSaveTrip.style.display = 'none';
      } catch (e) {
        console.error('Lỗi parse session trip:', e);
      }
    }
  }

  // Set default trip date to today
  var tripDateInput = document.getElementById('tripDate');
  var todayStr = new Date().toISOString().split('T')[0];
  tripDateInput.setAttribute('min', todayStr);
  tripDateInput.value = todayStr;
  // ============================
  // BƯỚC 2: Chat Wizard Logic
  // ============================
  var chatData = {}; // Holds all collected answers
  var chatMsgs = document.getElementById('chatMessages');
  var chatAnswerForm = document.getElementById('chatAnswerForm');
  var chatAnswerInput = document.getElementById('chatAnswerInput');
  var chatChips = document.getElementById('chatChips');
  var btnConfirmGenerate = document.getElementById('btnConfirmGenerate');
  var btnBackToStep1 = document.getElementById('btnBackToStep1');
  var stepBasic = document.getElementById('stepBasic');
  var stepChat = document.getElementById('stepChat');
  var stepDiscovery = document.getElementById('stepDiscovery');

  // ============================
  // BƯỚC KHÁM PHÁ: AI Discovery Logic
  // ============================
  var discoveryMsgs = document.getElementById('discoveryMessages');
  var discoveryForm = document.getElementById('discoveryForm');
  var discoveryInput = document.getElementById('discoveryInput');
  var discoveryChips = document.getElementById('discoveryChips');
  var discoveryActionBox = document.getElementById('discoveryActionBox');
  var btnAcceptDiscovery = document.getElementById('btnAcceptDiscovery');
  var btnModeForm = document.getElementById('btnModeForm');
  var btnModeDiscovery = document.getElementById('btnModeDiscovery');
  
  var discoveryHistory = [];
  var discoveredDestination = "";
  var discoveredBudget = "";
  var discoveredExactBudget = "";
  var discoveredIsShortTerm = false;
  var discoveredOutingTime = "";

  // Switch modes
  if (btnModeForm && btnModeDiscovery) {
    // Initial state
    btnModeForm.style.background = 'var(--accent)';
    btnModeForm.style.color = '#fff';

    btnModeForm.addEventListener('click', function() {
      stepBasic.style.display = 'block';
      stepDiscovery.style.display = 'none';
      stepChat.style.display = 'none';
      btnModeForm.style.background = 'var(--accent)';
      btnModeForm.style.color = '#fff';
      btnModeDiscovery.style.background = 'var(--bg-card)';
      btnModeDiscovery.style.color = 'var(--text)';
    });

    btnModeDiscovery.addEventListener('click', function() {
      stepBasic.style.display = 'none';
      stepDiscovery.style.display = 'block';
      stepChat.style.display = 'none';
      btnModeDiscovery.style.background = 'var(--accent)';
      btnModeDiscovery.style.color = '#fff';
      btnModeForm.style.background = 'var(--bg-card)';
      btnModeForm.style.color = 'var(--text)';
      
      if (discoveryMsgs.children.length === 0) {
        addDiscoveryBubble('Chào bạn! Bạn đang phân vân không biết đi đâu? Hãy cho tôi biết ngân sách và sở thích của bạn (VD: 5 triệu đi đâu cho mát?), tôi sẽ gợi ý cho bạn nhé! ✨', 'ai');
      }
    });
  }

  function addDiscoveryBubble(text, role) {
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + role;
    if (role === 'ai') {
      bubble.innerHTML = '<strong>✨ WanderAI</strong>' + text;
    } else {
      bubble.textContent = text;
    }
    discoveryMsgs.appendChild(bubble);
    discoveryMsgs.scrollTop = discoveryMsgs.scrollHeight;
  }

  if (discoveryForm) {
    discoveryForm.addEventListener('submit', /*#__PURE__*/function () {
      var _refDiscovery = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _calleeDiscovery(e) {
        var val, res, data;
        return _regenerator().w(function (_contextDiscovery) {
          while (1) switch (_contextDiscovery.p = _contextDiscovery.n) {
            case 0:
              e.preventDefault();
              val = discoveryInput.value.trim();
              if (val) {
                _contextDiscovery.n = 1;
                break;
              }
              return _contextDiscovery.a(2);
            case 1:
              addDiscoveryBubble(val, 'user');
              discoveryInput.value = '';
              discoveryChips.innerHTML = '';
              _contextDiscovery.p = 2;
              _contextDiscovery.n = 3;
              return fetch('/api/planner/discover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: val, history: discoveryHistory })
              });
            case 3:
              res = _contextDiscovery.v;
              _contextDiscovery.n = 4;
              return res.json();
            case 4:
              data = _contextDiscovery.v;
              if (data.success) {
                addDiscoveryBubble(data.answer, 'ai');
                discoveryHistory.push({ role: 'user', content: val });
                discoveryHistory.push({ role: 'assistant', content: data.answer });
                
                if (data.suggestions && data.suggestions.length > 0) {
                  data.suggestions.forEach(function(s) {
                    var chip = document.createElement('button');
                    chip.type = 'button';
                    chip.className = 'chat-chip';
                    chip.textContent = s;
                    chip.addEventListener('click', function() {
                      discoveryInput.value = s;
                      discoveryForm.dispatchEvent(new Event('submit'));
                    });
                    discoveryChips.appendChild(chip);
                  });
                }
                
                if (data.finalSelection) {
                  discoveredDestination = data.finalSelection;
                  discoveredBudget = data.suggestedBudget;
                  discoveredExactBudget = data.exactBudget;
                  discoveredIsShortTerm = !!data.isShortTerm;
                  discoveredOutingTime = data.outingTime || "";
                  discoveryActionBox.style.display = 'block';
                } else {
                  discoveryActionBox.style.display = 'none';
                }
              }
              _contextDiscovery.n = 6;
              break;
            case 5:
              _contextDiscovery.p = 5;
              console.error(_contextDiscovery.v);
              addDiscoveryBubble('Có lỗi xảy ra, vui lòng thử lại.', 'ai');
            case 6:
              return _contextDiscovery.a(2);
          }
        }, _calleeDiscovery, null, [[2, 5]]);
      }));
      return function (_xDiscovery) {
        return _refDiscovery.apply(this, arguments);
      };
    }());
  }

  if (btnAcceptDiscovery) {
    btnAcceptDiscovery.addEventListener('click', function() {
      document.getElementById('dest').value = discoveredDestination;
      if (discoveredBudget) {
        document.getElementById('budget').value = discoveredBudget;
      }
      // Store exact budget in chatData for later use in doGenerate
      chatData.exactBudget = discoveredExactBudget;
      chatData.isShortTerm = discoveredIsShortTerm;
      chatData.outingTime = discoveredOutingTime;

      // Toggle UI
      if (discoveredIsShortTerm) {
        document.getElementById('groupDays').style.display = 'none';
        document.getElementById('groupTime').style.display = 'block';
        document.getElementById('days').value = 1; // Default for short term
        document.getElementById('outingTime').value = discoveredOutingTime;
      } else {
        document.getElementById('groupDays').style.display = 'block';
        document.getElementById('groupTime').style.display = 'none';
      }
      
      btnModeForm.click();
      // Optional: highlight the destination field
      document.getElementById('dest').focus();
      document.getElementById('dest').style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.4)';
      setTimeout(() => {
        document.getElementById('dest').style.boxShadow = '';
      }, 2000);
    });
  }

  var QUESTIONS = [
    {
      key: 'accommodation',
      question: 'Bạn muốn ở đâu trong chuyến đi?',
      chips: ['Khách sạn 2-3 sao', 'Homestay / Nhà nghỉ bình dân', 'Hostel / Giường tầng (siêu tiết kiệm)', 'Cắm trại / Dã ngoại', 'Không cần AI gợi ý (tự túc)'],
      freeText: false
    },
    {
      key: 'transport',
      question: 'Bạn sẽ di chuyển bằng phương tiện gì?',
      chips: ['Máy bay + xe dịch vụ', 'Xe khách / Tàu hỏa', 'Thuê xe máy tự lái', 'Phượt bằng xe máy từ nhà'],
      freeText: false
    },
    {
      key: 'companion',
      question: 'Bạn đi cùng ai?',
      chips: ['Đi một mình 🧍', 'Đi đôi / Couple 💑', 'Nhóm bạn bè 👫', 'Gia đình có trẻ nhỏ 👨‍👩‍👧', 'Gia đình người lớn'],
      freeText: false
    },
    {
      key: 'pace',
      question: 'Bạn muốn nhịp độ chuyến đi như thế nào?',
      chips: ['Thư giãn (ít di chuyển, nghỉ ngơi nhiều)', 'Cân bằng (kết hợp tham quan và nghỉ)', 'Năng động (đi nhiều điểm, check-in)', 'Phiêu lưu mạo hiểm (trekking, leo núi)'],
      freeText: false
    },
    {
      key: 'interests',
      question: 'Bạn có sở thích hay yêu cầu đặc biệt nào không? (Nhập hoặc bấm Bỏ qua)',
      chips: ['Bỏ qua'],
      freeText: true
    }
  ];

  var currentQuestion = 0;

  function addBubble(text, role) {
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + role;
    if (role === 'ai') {
      bubble.innerHTML = '<strong>✨ WanderAI</strong>' + text;
    } else {
      bubble.textContent = text;
    }
    chatMsgs.appendChild(bubble);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }

  function renderQuestion(idx) {
    chatChips.innerHTML = '';
    chatAnswerForm.style.display = 'none';
    btnConfirmGenerate.style.display = 'none';

    if (idx >= QUESTIONS.length) {
      // All done
      addBubble('Tuyệt vời! Tôi đã có đủ thông tin. Nhấn nút bên dưới để AI lên lịch trình cho bạn! 🚀', 'ai');
      btnConfirmGenerate.style.display = 'block';
      return;
    }

    var q = QUESTIONS[idx];
    addBubble(q.question, 'ai');

    // --- LỌC CHIPS THEO NGÂN SÁCH ---
    var budgetStr = chatData.budget || '';
    var budgetNum = parseInt(budgetStr.replace(/[^0-9]/g, '')) || 0;
    var days = parseInt(chatData.days) || 1;
    var budgetPerDay = budgetNum / days;

    var filteredChips = q.chips.filter(function(chip) {
      // Lọc chỗ ở
      if (q.key === 'accommodation') {
        if (budgetPerDay < 300000 && chip.includes('2-3 sao')) return false;
        if (budgetPerDay < 150000 && chip.includes('Homestay')) return false;
      }
      // Lọc phương tiện
      if (q.key === 'transport') {
        if (budgetNum < 2000000 && chip.includes('Máy bay')) return false;
        // Nếu đi Bắc Ninh/Hải Dương (gần HN) mà ngân sách thấp thì không máy bay
        var dest = (chatData.destination || '').toLowerCase();
        if ((dest.includes('bắc ninh') || dest.includes('hải dương') || dest.includes('hà nội')) && chip.includes('Máy bay')) return false;
      }
      return true;
    });

    // Nếu sau khi lọc không còn chip nào (trường hợp cực hiếm), dùng mặc định hoặc "Tự túc"
    if (filteredChips.length === 0) filteredChips = [q.chips[q.chips.length - 1]];

    // Render filtered chips
    filteredChips.forEach(function(chip) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chat-chip';
      btn.textContent = chip;
      btn.addEventListener('click', function() {
        var answer = chip === 'Bỏ qua' ? 'Không có yêu cầu đặc biệt' : chip;
        addBubble(chip, 'user');
        chatData[q.key] = answer;
        currentQuestion++;
        setTimeout(function() { renderQuestion(currentQuestion); }, 350);
      });
      chatChips.appendChild(btn);
    });

    // Free-text input
    if (q.freeText) {
      chatAnswerForm.style.display = 'flex';
      chatAnswerInput.value = '';
      chatAnswerInput.focus();
    }
  }

  // Step 1 form submit → move to chat
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    chatData.destination = document.getElementById('dest').value.trim();
    chatData.days = parseInt(document.getElementById('days').value) || 1;
    chatData.budget = document.getElementById('budget').value;
    chatData.tripDate = document.getElementById('tripDate').value;
    chatData.outingTime = document.getElementById('outingTime').value;

    // Check if short term was toggled manually or from discovery
    var isShort = document.getElementById('groupTime').style.display === 'block';
    chatData.isShortTerm = isShort;

    console.log('--- STEP 1 DATA CAPTURED ---');
    console.log('Dest:', chatData.destination);
    console.log('Days:', chatData.days);
    console.log('Budget:', chatData.budget);

    // Hide step 1, show step 2
    stepBasic.style.display = 'none';
    stepChat.style.display = 'block';
    chatMsgs.innerHTML = '';
    currentQuestion = 0;

    addBubble(`Tuyệt! ${chatData.destination} trong ${chatData.days} ngày với ngân sách <strong>${chatData.budget}</strong>. Cho tôi hỏi thêm một chút để lên kế hoạch thật hợp lý nhé! 😊`, 'ai');
    setTimeout(function() { renderQuestion(currentQuestion); }, 500);
  });

  // Free text answer submit
  chatAnswerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var val = chatAnswerInput.value.trim();
    if (!val) return;
    addBubble(val, 'user');
    chatData[QUESTIONS[currentQuestion].key] = val;
    currentQuestion++;
    chatChips.innerHTML = '';
    chatAnswerForm.style.display = 'none';
    setTimeout(function() { renderQuestion(currentQuestion); }, 350);
  });

  // Back button
  if (btnBackToStep1) {
    btnBackToStep1.addEventListener('click', function() {
      stepBasic.style.display = 'block';
      stepChat.style.display = 'none';
      chatData = {};
      currentQuestion = 0;
    });
  }

  // Confirm generate
  if (btnConfirmGenerate) {
    btnConfirmGenerate.addEventListener('click', function() {
      doGenerate(chatData);
    });
  }

  async function doGenerate(data) {
    placeholder.style.display = 'none';
    resultContainer.style.display = 'none';
    refineBox.style.display = 'none';
    loader.style.display = 'flex';
    btnConfirmGenerate.disabled = true;
    btnConfirmGenerate.textContent = 'Đang tạo...';

    try {
      var token = localStorage.getItem('wander_token');
      var res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({
          destination: data.destination,
          days: data.days,
          budget: data.budget,
          accommodation: data.accommodation,
          transport: data.transport,
          companion: data.companion,
          pace: data.pace,
          interests: data.interests,
          tripDate: data.tripDate,
          exactBudget: data.exactBudget,
          isShortTerm: data.isShortTerm,
          outingTime: data.outingTime
        })
      });
      var json = await res.json();
      if (json.success && json.plan) {
        currentItineraryId = json.itineraryId;
        planHistory.push(json.plan);
        currentPlanIndex = planHistory.length - 1;
        renderVersionTabs();
        renderItinerary(json.plan, data.destination, data.days, data.tripDate);
        resultContainer.style.display = 'block';
        refineBox.style.display = 'block';
        resetSaveButton();
        if (data.tripDate) saveTripReminder(data.destination, data.tripDate);
      } else {
        alert(json.message || 'Có lỗi xảy ra khi tạo lịch trình.');
        placeholder.style.display = 'flex';
      }
    } catch(err) {
      console.error(err);
      alert('Không thể kết nối AI. Vui lòng thử lại.');
      placeholder.style.display = 'flex';
    } finally {
      loader.style.display = 'none';
      btnConfirmGenerate.disabled = false;
      btnConfirmGenerate.textContent = '🚀 Tạo lịch trình ngay!';
    }
  }



  // Chức năng Sửa lại lịch trình (Refine)
  refineForm.addEventListener('submit', /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(e) {
      var currentPlanJson, userFeedback, destination, days, token, res, data, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            e.preventDefault();
            if (!(currentPlanIndex < 0)) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2);
          case 1:
            currentPlanJson = planHistory[currentPlanIndex];
            userFeedback = refineInput.value;
            destination = document.getElementById('dest').value;
            days = document.getElementById('days').value;
            refineBtn.disabled = true;
            refineBtn.innerText = 'Đang sửa...';
            resultContainer.style.display = 'none';
            refineBox.style.display = 'none';
            loader.style.display = 'flex';
            _context2.p = 2;
            token = localStorage.getItem('wander_token');
            _context2.n = 3;
            return fetch('/api/planner/refine', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token || ''
              },
              body: JSON.stringify({
                oldPlanJson: currentPlanJson,
                userFeedback: userFeedback,
                itineraryId: currentItineraryId
              })
            });
          case 3:
            res = _context2.v;
            _context2.n = 4;
            return res.json();
          case 4:
            data = _context2.v;
            if (data.success && data.plan) {
              planHistory.push(data.plan);
              currentPlanIndex = planHistory.length - 1;
              if (data.itineraryId) currentItineraryId = data.itineraryId;
              renderVersionTabs();
              renderItinerary(data.plan, destination, days, document.getElementById('tripDate').value);
              resultContainer.style.display = 'block';
              refineBox.style.display = 'block';
              refineInput.value = '';
              resetSaveButton();
            } else {
              alert(data.message || 'Có lỗi xảy ra, thử lại sau nhé.');
              resultContainer.style.display = 'block';
              refineBox.style.display = 'block';
            }
            _context2.n = 6;
            break;
          case 5:
            _context2.p = 5;
            _t2 = _context2.v;
            console.error(_t2);
            alert('Lỗi mạng, kiểm tra lại.');
            resultContainer.style.display = 'block';
            refineBox.style.display = 'block';
          case 6:
            _context2.p = 6;
            refineBtn.disabled = false;
            refineBtn.innerText = 'Sửa lại';
            loader.style.display = 'none';
            return _context2.f(6);
          case 7:
            return _context2.a(2);
        }
      }, _callee2, null, [[2, 5, 6, 7]]);
    }));
    return function (_x2) {
      return _ref2.apply(this, arguments);
    };
  }());

  // Lưu Vĩnh Viễn Lịch Trình Này
  btnSaveTrip.addEventListener('click', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
    var token, res, data, _t3;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          token = localStorage.getItem('wander_token');
          if (token) {
            _context3.n = 1;
            break;
          }
          alert("Bạn cần Đăng Nhập để lưu lịch trình vào hồ sơ cá nhân!");
          window.location.href = '/index.html#login'; // Redirect to home/login
          return _context3.a(2);
        case 1:
          if (currentItineraryId) {
            _context3.n = 2;
            break;
          }
          alert("Lỗi: Không tìm thấy ID lịch trình. Vui lòng tạo lại.");
          return _context3.a(2);
        case 2:
          btnSaveTrip.disabled = true;
          saveTripStatus.style.display = 'block';
          saveTripStatus.innerText = 'Đang lưu vào hồ sơ...';
          _context3.p = 3;
          _context3.n = 4;
          return fetch('/api/planner/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            },
            body: JSON.stringify({
              itineraryId: currentItineraryId
            })
          });
        case 4:
          res = _context3.v;
          _context3.n = 5;
          return res.json();
        case 5:
          data = _context3.v;
          if (data.success) {
            saveTripStatus.innerText = '✅ Đã lưu thành công! Hãy xem tại mục "Chuyến đi của tôi" trên menu.';
            saveTripStatus.style.color = '#10b981';
            btnSaveTrip.innerText = 'Đã Lưu Lịch Trình';
          } else {
            saveTripStatus.innerText = '❌ ' + (data.message || 'Lưu thất bại.');
            saveTripStatus.style.color = '#f43f5e';
            btnSaveTrip.disabled = false;
          }
          _context3.n = 7;
          break;
        case 6:
          _context3.p = 6;
          _t3 = _context3.v;
          console.error(_t3);
          saveTripStatus.innerText = '❌ Lỗi kết nối mạng.';
          saveTripStatus.style.color = '#f43f5e';
          btnSaveTrip.disabled = false;
        case 7:
          return _context3.a(2);
      }
    }, _callee3, null, [[3, 6]]);
  })));

  // Chuyển Ngay Sang Màn Hình Chỉ Đường (Navigator)
  if (btnStartNav) {
    btnStartNav.addEventListener('click', function () {
      var _document$getElementB;
      if (currentPlanIndex < 0 || !planHistory[currentPlanIndex]) {
        alert("Lỗi: Không tìm thấy nội dung lịch trình.");
        return;
      }
      var dest = document.getElementById('dest').value || ((_document$getElementB = document.getElementById('plan-title')) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.innerText) || "Điểm đến";
      var planJson = planHistory[currentPlanIndex];
      sessionStorage.setItem('wander_active_itinerary', JSON.stringify(planJson));
      sessionStorage.setItem('wander_active_dest', dest);
      window.location.href = 'navigator.html';
    });
  }
  function resetSaveButton() {
    btnSaveTrip.disabled = false;
    btnSaveTrip.innerText = '♥️ Lưu Lịch Trình Này';
    saveTripStatus.style.display = 'none';
  }

  // ♥ Hàm lưu reminder vào localStorage và xin quyền thông báo
  function saveTripReminder(destination, tripDate) {
    // Lưu vào localStorage
    var reminders = JSON.parse(localStorage.getItem('wander_reminders') || '[]');
    var exists = reminders.find(function (r) {
      return r.tripDate === tripDate && r.destination === destination;
    });
    if (!exists) {
      reminders.push({
        destination: destination,
        tripDate: tripDate
      });
      localStorage.setItem('wander_reminders', JSON.stringify(reminders));
    }
    // Xin quyền thông báo
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // ♥ Kiểm tra nhắc nhở khi load trang
  function checkTripReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    var reminders = JSON.parse(localStorage.getItem('wander_reminders') || '[]');
    var today = new Date().toISOString().split('T')[0];
    reminders.forEach(function (r) {
      if (r.tripDate === today) {
        new Notification('🧳 WanderViệt — Hôm nay là ngày đi!', {
          body: "H\xF4m nay b\u1EA1n c\xF3 chuy\u1EBFn \u0111i \u0111\u1EBFn ".concat(r.destination, ". Ch\xFAc b\u1EA1n l\xEAn \u0111\u01B0\u1EDDng vui v\u1EBB! \uD83C\uDF1F"),
          icon: '/favicon.ico'
        });
      }
    });
  }
  checkTripReminders();
  function renderVersionTabs() {
    versionTabs.innerHTML = '';
    planHistory.forEach(function (_, idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'planner-btn';
      btn.style.padding = '0.4rem 1rem';
      btn.style.width = 'auto';
      btn.style.fontSize = '0.9rem';
      btn.style.borderRadius = '2rem';
      if (idx === currentPlanIndex) {
        btn.style.background = 'var(--color-primary, var(--accent))';
        btn.style.color = '#fff';
        btn.innerText = idx === 0 ? 'Bản Gốc' : "B\u1EA3n S\u1EEDa ".concat(idx);
      } else {
        btn.style.background = 'var(--surface)';
        btn.style.color = 'var(--text-muted)';
        btn.style.border = '1px solid var(--border)';
        btn.innerText = idx === 0 ? 'Bản Gốc' : "B\u1EA3n S\u1EEDa ".concat(idx);
      }
      btn.addEventListener('click', function () {
        currentPlanIndex = idx;
        var dest = document.getElementById('dest').value;
        var d = document.getElementById('days').value;
        renderVersionTabs();
        renderItinerary(planHistory[idx], dest, d);
        resetSaveButton();
      });
      versionTabs.appendChild(btn);
    });
  }

  // ♥ Helper: format ngày VN (VD: Thứ Bảy, 05/04/2026)
  function formatDayVN(dateStr) {
    var days = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    var d = new Date(dateStr + 'T00:00:00');
    var dayName = days[d.getDay()];
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    return "".concat(dayName, ", ").concat(dd, "/").concat(mm, "/").concat(d.getFullYear());
  }
  function renderItinerary(plan, destination, days) {
    var tripDate = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    if (!plan || !plan.itinerary) return;
    var accomHtml = '';
    if (plan.accommodationSuggestion) {
      accomHtml = `
          <div class="meta-card">
            <div class="meta-icon-wrapper" style="background: rgba(2, 132, 199, 0.1); color: #0284c7; font-size: 1.2rem;">${plan.accommodationSuggestion.icon}</div>
            <div class="meta-content">
              <p>${plan.accommodationSuggestion.typeLabel}</p>
              <h4>${plan.accommodationSuggestion.nameAndCost}</h4>
            </div>
          </div>
      `;
    } else {
      accomHtml = `
          <div class="meta-card">
            <div class="meta-icon-wrapper" style="background: rgba(2, 132, 199, 0.1); color: #0284c7;">🏨</div>
            <div class="meta-content">
              <p>Đề xuất Lưu trú</p>
              <h4>${plan.suggestedHotel || 'Tự chọn'}</h4>
            </div>
          </div>
      `;
    }

    var html = `
      <div class="timeline-header" style="margin-top: 1rem;">
        <h2 style="font-size: 1.8rem; color: var(--text); margin-bottom: 0.5rem; line-height: 1.3;">
          Lịch trình: ${destination} (${days} Ngày)
        </h2>
        <p class="timeline-summary">${plan.tripSummary}</p>
        <div class="timeline-meta">
          <div class="meta-card">
            <div class="meta-icon-wrapper" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">💰</div>
            <div class="meta-content">
              <p>Dự kiến Chi phí</p>
              <h4>${plan.estimatedCost}</h4>
            </div>
          </div>
          ${accomHtml}
        </div>
      </div>
    `;
    plan.itinerary.forEach(function (dayData, idx) {
      // ♥ Tính ngày thực tế nếu có tripDate
      var realDateLabel = '';
      if (tripDate) {
        var d = new Date(tripDate + 'T00:00:00');
        d.setDate(d.getDate() + idx);
        var dateStr = d.toISOString().split('T')[0];
        realDateLabel = " \u2014 ".concat(formatDayVN(dateStr));
      }
      html += "\n        <div class=\"timeline-day\">\n          <div class=\"day-badge\">Ng\xE0y ".concat(dayData.day.toString().replace(/\s*\(.*\)/, '')).concat(realDateLabel, "</div>\n          <div class=\"day-activities\">\n      ");
      (dayData.activities || []).forEach(function (act) {
        html += "\n            <div class=\"activity-card\">\n              <div class=\"activity-time\">".concat(act.time, "</div>\n              <h3 class=\"activity-title\" style=\"margin-top: 0.25rem;\">").concat(act.task, "</h3>\n              <p style=\"color: var(--text-muted); margin-bottom: 0.5rem; font-size: 0.95rem;\">").concat(act.location, "</p>\n              <div class=\"activity-details\" style=\"border-top: 1px dashed var(--border); padding-top: 0.5rem;\">\n                <span style=\"font-size:0.85rem; color:var(--text-muted)\">Chi ph\xED d\u1EF1 ki\u1EBFn</span>\n                <span class=\"activity-cost\">").concat(act.cost, "</span>\n              </div>\n            </div>\n        ");
      });
      html += "\n          </div>\n        </div>\n      ";
    });
    timelineContent.innerHTML = html;
  }
});
