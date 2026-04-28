const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { auth, JWT_SECRET } = require('./auth');
const Groq = require('groq-sdk');
const jwt = require('jsonwebtoken');
const logAction = require('../utils/logger');

// Middleware xác thực tùy chọn: có token thì gắn user, không có vẫn cho qua
const optionalAuth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded.user || decoded.account || decoded;
    } catch (e) {
      // Token không hợp lệ, bỏ qua
    }
  }
  next();
};

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY_PLANNER });

// Nạp danh sách điểm đến để đưa vào Prompt Context cho AI
const fs = require('fs');
const path = require('path');
let placesContextList = "";
try {
  const content = fs.readFileSync(path.join(__dirname, '../apps/user-web/places-data.js'), 'utf-8');
  const extractJson = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
  const placesData = eval(extractJson);
  placesContextList = placesData.map(p => `- ${p.name} (${p.region}): ${p.text}`).join('\n');
} catch (e) {
  console.error("Lỗi đọc places-data trong planner:", e);
}

const Itinerary = require('../models/Itinerary');
const User = require('../models/User'); // ♥ Thêm User model để lấy thông tin chi tiết

// Lên lịch trình
router.post('/generate', optionalAuth, async (req, res) => {
  try {
    const { destination, days, budget, accommodation, pace, transport, interests, companion, tripDate } = req.body;

    if (!destination || !days) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp điểm đến và số ngày.' });
    }

    // Pre-process: detect special time-sensitive activities for the prompt
    const interestsLower = (interests || '').toLowerCase();
    const hasSunriseActivity = interestsLower.includes('săn mây') || interestsLower.includes('bình minh') || interestsLower.includes('sunrise') || interestsLower.includes('mặt trời mọc');
    const hasSunsetActivity = interestsLower.includes('hoàng hôn') || interestsLower.includes('sunset');
    const hasTrekking = interestsLower.includes('trekking') || interestsLower.includes('leo núi');

    const numDays = parseInt(days);

    const prompt = `Bạn là chuyên gia lập lịch du lịch thực tế của WanderViệt. Hãy tạo lịch trình ${numDays} ngày cho chuyến đi sau.

=== THÔNG TIN CHUYẾN ĐI ===
- Điểm đến: ${destination}
- Số ngày: ${numDays} ngày (BẮT BUỘC tạo mảng itinerary có ĐÚNG ${numDays} phần tử cho Ngày 1, Ngày 2... đến Ngày ${numDays})
- Ngân sách tổng cộng: ${budget}
- Loại lưu trú: ${accommodation}
- Phương tiện: ${transport}
- Đi cùng: ${companion}
- Nhịp độ: ${pace}
- Yêu cầu đặc biệt: "${interests || 'Không có'}"
- Chế độ: ${req.body.isShortTerm ? 'HOẠT ĐỘNG NGẮN / ĐI ĂN / ĐI CHƠI TRONG NGÀY' : 'CHUYẾN ĐI DÀI NGÀY'}
- Thời gian cụ thể (nếu có): ${req.body.outingTime || 'Không có'}

=== QUY TẮC PHÂN TÍCH YÊU CẦU (ĐỌC KỸ TRƯỚC KHI LÀM) ===

${hasSunriseActivity ? `!!! CẢNH BÁO ĐẶC BIỆT: Khách muốn "SĂN MÂY / BÌNH MINH / MẶT TRỜI MỌC"
→ Điều này xảy ra lúc 04:30–06:30 BUỔI SÁNG SỚM, TRƯỚC KHI TRỜI SÁNG.
→ Ngày có hoạt động này BẮT BUỘC phải bắt đầu lúc 04:00–04:30.
→ TUYỆT ĐỐI KHÔNG được xếp "săn mây" vào buổi chiều hay tối (14h, 17h, 19h là SAI HOÀN TOÀN).
→ Sau khi săn mây về (~07:00–08:00), mới ăn sáng và tiếp tục các hoạt động khác.` : ''}
${hasTrekking ? `→ Hoạt động Trekking/Leo núi: bắt đầu lúc 05:00–06:00 để tránh nắng trưa.` : ''}
${hasSunsetActivity ? `→ Hoạt động Hoàng hôn: xếp lúc 17:30–19:00.` : ''}

=== QUY TẮC CẤU TRÚC LỊCH (BẮT BUỘC) ===
1. NGÀY 1 (Di chuyển + khám phá nhẹ):
   - Bắt đầu sáng tại điểm xuất phát, di chuyển đến ${destination}. Ghi rõ thời gian di chuyển thực tế (VD: xe khách 6 tiếng, máy bay 1.5 tiếng...).
   - Chỉ có hoạt động nhẹ nhàng sau khi đến nơi (nhận phòng, ăn tối, nghỉ ngơi chuẩn bị sức khỏe).
2. NGÀY 2 đến NGÀY ${numDays - 1} (Trải nghiệm chính):
   - Lên lịch đầy đủ mọi hoạt động theo yêu cầu đặc biệt của khách.
   - Thời gian liên tục từ sáng đến tối, không bỏ trống.
3. NGÀY CUỐI (NGÀY ${numDays}): 
   - Sáng: Hoạt động cuối + mua quà lưu niệm.
   - Chiều: Di chuyển về nhà.

- TỶ LỆ NGÂN SÁCH (QUAN TRỌNG):
  + Nếu ngân sách thấp (Dưới 1M): hostel/dorm, cơm bình dân, đi xe máy/xe khách.
  + Nếu ngân sách cao (3M-10M cho 2-3 ngày): PHẢI đề xuất khách sạn 4-5 sao hoặc resort, nhà hàng sang trọng, xe riêng/limousine. TUYỆT ĐỐI không dùng hostel cho người có ngân sách 4.5 triệu đi 2 ngày.
- Tổng tất cả chi phí PHẢI XẤP XỈ (gần bằng) nhưng KHÔNG VƯỢT ngân sách đã chọn. Nếu khách giàu, hãy tiêu tiền giúp họ vào dịch vụ tốt.

=== KIỂM TRA TRƯỚC KHI XUẤT ===
Trước khi trả về JSON, hãy tự kiểm tra:
✓ Mảng itinerary có đúng ${numDays} phần tử không?
✓ Nếu khách muốn săn mây, ngày đó có bắt đầu lúc 04:00–04:30 không?
✓ ĐỊA PHƯƠNG HÓA: Nếu đi từ Hà Nội, dùng bến xe Mỹ Đình/Giáp Bát. Nếu đi từ Sài Gòn, dùng bến xe Miền Đông/Miền Tây. KHÔNG RÂU ÔNG NỌ CẮM CẰM BÀ KIA.
✓ THỰC TẾ DI CHUYỂN: Hà Nội - Bắc Giang/Bắc Ninh/Hải Dương chỉ mất 1-1.5 tiếng. Không được ghi 6 tiếng.
- TÍNH TOÁN CHI PHÍ (QUY TẮC TỐI THƯỢNG): 
  - TỔNG CHI PHÍ (estimatedCost) = (Giá khách sạn * số đêm) + (Tổng cost của TẤT CẢ hoạt động).
  - estimatedCost PHẢI ≤ ${req.body.exactBudget || budget}. KHÔNG ĐƯỢC VƯỢT QUÁ DÙ CHỈ 1 ĐỒNG nếu ngân sách có con số cụ thể (VD: 500k).
  - Nếu ngân sách thấp (Dưới 1 triệu): TUYỆT ĐỐI KHÔNG đề xuất khách sạn đắt tiền. Nếu không đủ tiền thuê phòng, hãy ghi "Không cần khách sạn/Ở nhà" và đặt giá là 0đ.
  - Phải trừ hao chi phí dự phòng 10-15% trong tổng tính toán.
  - Mọi hoạt động trong itinerary PHẢI có giá tiền (cost) thực tế.

=== FORMAT JSON ĐẦU RA ===
Chỉ trả về JSON hợp lệ, không có text khác:
{
  "tripSummary": "Mô tả ngắn chuyến đi (nêu rõ điểm nổi bật và yêu cầu đặc biệt)",
  "estimatedCost": "TỔNG CHI PHÍ THỰC TẾ (VNĐ)",
  "accommodationSuggestion": {
    "typeLabel": "Loại lưu trú",
    "icon": "Emoji",
    "nameAndCost": "Tên khách sạn - Giá/đêm (Giá phải tương xứng với ngân sách ${budget})"
  },
  "itinerary": [
    {
      "day": "1 (HH:MM - HH:MM)",
      "activities": [
        { "time": "HH:MM - HH:MM", "task": "Tên hoạt động", "location": "Địa điểm cụ thể", "cost": "XXXđ" }
      ]
    }
  ]
}

LƯU Ý QUAN TRỌNG NHẤT (PHẢI TUÂN THỦ TUYỆT ĐỐI): 
- SỐ NGÀY: Bạn được yêu cầu tạo lịch trình ${numDays} ngày. Mảng "itinerary" PHẢI CÓ CHÍNH XÁC ${numDays} PHẦN TỬ. 
- Nếu ${numDays} = 4, mảng itinerary phải có itinerary[0], itinerary[1], itinerary[2], itinerary[3]. KHÔNG ĐƯỢC THIẾU.
- CHI PHÍ: Ngân sách là ${budget}. Tổng giá trị (estimatedCost) của khách sạn và tất cả hoạt động PHẢI XẤP XỈ con số này (Sai số tối đa 10%). 
- CHẤT LƯỢNG: Nếu ngân sách cao, hãy chọn khách sạn đắt nhất và ăn uống sang trọng nhất có thể để tiêu hết tiền của khách.
- ĐỊA LÝ: Đảm bảo địa điểm (location) chính xác với tỉnh/thành phố ${destination}.
${req.body.isShortTerm || numDays <= 1 ? `
=== QUY TẮC RIÊNG CHO HOẠT ĐỘNG NGẮN / CHUYẾN ĐI 1 NGÀY ===
1. Vì đây là chuyến đi ngắn hoặc đi chơi trong ngày (${req.body.outingTime || 'vài tiếng'}), TUYỆT ĐỐI KHÔNG gợi ý khách sạn. Hãy để "accommodationSuggestion" là null hoặc ghi "Không cần lưu trú".
2. Không cần chia ngày. Chỉ cần tập trung vào các hoạt động liên tục trong khoảng thời gian khách yêu cầu.
3. PHẢI có địa chỉ cực kỳ cụ thể (Số nhà, tên đường).
4. TripSummary phải thân thiện như một người bạn địa phương giới thiệu.
` : `
=== QUY TẮC LƯU TRÚ (CHO CHUYẾN ĐI QUA ĐÊM) ===
- Tên khách sạn và giá tiền PHẢI THỰC TẾ. 
- Nếu ngân sách thấp (VD: 500k cho cả chuyến đi), BẮT BUỘC chọn Nhà nghỉ/Hostel giá 100k-150k hoặc SKIP luôn nếu không đủ.
- KHÔNG ĐƯỢC đề xuất khách sạn Metropole (4-5 triệu) cho người có ngân sách 500k. Đây là lỗi logic cực nặng.
=== CHÍNH SÁCH NGÂN SÁCH (BẮT BUỘC) ===
1. Nếu khách chọn ngân sách cụ thể (VD: 500k), bạn KHÔNG ĐƯỢC PHÉP gợi ý bất kỳ dịch vụ nào vượt quá con số này.
2. Nếu ngân sách không đủ cho khách sạn cao cấp, hãy chọn khách sạn bình dân hoặc không gợi ý. 
3. TUYỆT ĐỐI KHÔNG ĐƯỢC CHỌN Metropole, Intercontinental, hay Resort cho ngân sách dưới 5 triệu VNĐ.
4. Nếu đây là đi chơi ngắn (isShortTerm=true), đặt giá khách sạn = 0 và skip suggestion.
`}`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Bạn là chuyên gia lập lịch du lịch thực địa tại Việt Nam. Nhiệm vụ: tạo lịch trình CHÍNH XÁC, THỰC TẾ theo đúng yêu cầu.
Quy tắc tuyệt đối:
- "Săn mây / bình minh" → hoạt động lúc 04:30–06:30 SÁNG SỚM, KHÔNG được xếp chiều tối.
- Số ngày trong itinerary PHẢI BẰNG số ngày được yêu cầu.
- Ngày 1 PHẢI tính thời gian di chuyển đến điểm đến.
- ĐỘ CHÍNH XÁC: Bạn PHẢI cung cấp địa chỉ (location) thực tế, chính xác tại Việt Nam. Không được bịa đặt tên quán hay địa chỉ sai lệch.
- CHẾ ĐỘ "KHÔNG QUAN TÂM HẠN MỨC": Nếu budget là "Không quan tâm hạn mức", hãy mặc định chọn những dịch vụ CAO CẤP nhất, quán ăn NỔI TIẾNG nhất và KHÔNG cần lo lắng về giá.
- Chỉ trả về JSON hợp lệ.`
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    let aiPlanStr = response.choices[0].message.content;
    aiPlanStr = aiPlanStr.trim();

    let aiPlanJson;
    try {
      aiPlanJson = JSON.parse(aiPlanStr);
    } catch (parseErr) {
      console.error('Lỗi Parse JSON:', parseErr.message, 'Data:', aiPlanStr);
      return res.status(500).json({ success: false, message: 'Lỗi biên dịch dữ liệu AI. Vui lòng thử lại.' });
    }

    // Lấy thông tin chi tiết người dùng nếu đang đăng nhập để lưu vào DB cho dễ xem
    let userName = 'Khách vãng lai';
    let userEmail = '';
    if (req.user) {
      const userDoc = await User.findById(req.user.id);
      if (userDoc) {
        userName = userDoc.displayName || userDoc.name;
        userEmail = userDoc.email;
      }
    }

    // Lưu vào database, tự động gắn userId nếu đang đăng nhập
    const newItin = new Itinerary({
      destination, days, budget, companion, interests,
      tripDate: tripDate ? new Date(tripDate) : null,
      planJson: aiPlanJson,
      userId: req.user ? req.user.id : null,
      userName,
      userEmail
    });
    const savedDoc = await newItin.save();
    if (req.user) {
      await logAction(userEmail, 'user', 'ITINERARY_GENERATED', { destination, days, itineraryId: savedDoc._id });
    }

    res.json({ success: true, plan: aiPlanJson, itineraryId: savedDoc._id });
  } catch (error) {
    console.error('❌ Planner API Error Detail:', error);
    if (error.response && error.response.data) {
      console.error('Planner Error Response Data:', JSON.stringify(error.response.data));
    }
    res.status(500).json({ success: false, message: 'Lỗi gọi Trợ lý AI: ' + (error.message || 'Không xác định') });
  }
});

// Chỉnh sửa lịch trình (iterative refinement)
router.post('/refine', async (req, res) => {
  try {
    const { oldPlanJson, userFeedback } = req.body;

    if (!oldPlanJson || !userFeedback) {
      return res.status(400).json({ success: false, message: 'Lỗi thiếu dữ liệu tinh chỉnh.' });
    }

    const prompt = `
Bạn là Chuyên gia Lên Lịch Trình đang chỉnh sửa bản thảo.
Dưới đây là một lịch trình mẫu bạn đang tư vấn bằng định dạng JSON:
${JSON.stringify(oldPlanJson, null, 2)}

Khách hàng vừa phản ánh: "${userFeedback}"

YÊU CẦU:
Hãy xem xét phản ánh của khách và TẠO LẠI TOÀN BỘ JSON lịch trình mới (sửa những phần khách không thích, giữ nguyên những thứ hợp lý).
Đầu ra BẮT BUỘC tiếp tục trả về duy nhất chuỗi JSON có đúng cấu trúc:
{ tripSummary, estimatedCost, accommodationSuggestion: { typeLabel, icon, nameAndCost }, itinerary (array các ngày, bên trong chứa activities với thuộc tính time, task, location, cost) }.
Thuộc tính "day" của mảng "itinerary" phải chứa chuỗi gồm ngày và giờ bao quát (VD: "1 (06:00 - 22:30)").
Không bao gồm bất kỳ text nào khác ngoài JSON. Vẫn giữ thời gian cực cụ thể (từ sáng sớm đến tối khuya).
    `;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Bạn là chuyên gia tinh chỉnh lịch trình. Chỉ trả về JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    let aiPlanStr = response.choices[0].message.content;
    aiPlanStr = aiPlanStr.trim();

    let newPlanJson;
    try {
      newPlanJson = JSON.parse(aiPlanStr);
    } catch (parseErr) {
      console.error('Lỗi Parse JSON (Refine):', parseErr.message, 'Data:', aiPlanStr);
      return res.status(500).json({ success: false, message: 'Lỗi biên dịch dữ liệu sửa chữa từ AI.' });
    }

    // Lưu bản refine thành 1 record mới với destination, days vv.. từ DB (nếu có itineraryId truyền lên)
    let newItineraryId = null;
    const { itineraryId } = req.body;
    if (itineraryId) {
      const oldItin = await Itinerary.findById(itineraryId);
      if (oldItin) {
        const refinedItin = new Itinerary({
          destination: oldItin.destination,
          days: oldItin.days,
          budget: oldItin.budget,
          companion: oldItin.companion,
          interests: oldItin.interests,
          planJson: newPlanJson,
          // Nếu oldItin đã assign cho user (vì đã ấn Save), thì bản Refine này chưa tự động save để tránh rác
          userId: null
        });
        const savedDoc = await refinedItin.save();
        newItineraryId = savedDoc._id;
      }
    }

    if (newItineraryId && req.user) {
      await logAction(req.user.email, 'user', 'ITINERARY_REFINED', { itineraryId: newItineraryId });
    }
    res.json({ success: true, plan: newPlanJson, itineraryId: newItineraryId });
  } catch (error) {
    console.error('Planner Refine API Error:', error.message || error);
    res.status(500).json({ success: false, message: 'Lỗi chỉnh sửa AI: ' + (error.message || 'Không rõ') });
  }
});

// Gợi ý điểm đến (Discovery)
router.post('/discover', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập yêu cầu.' });
    }

    const messages = [
      {
        role: 'system',
        content: `Bạn là trợ lý du lịch WanderViệt. Nhiệm vụ của bạn là lắng nghe yêu cầu của khách hàng (ngân sách, sở thích, thời tiết...) và gợi ý những điểm đến phù hợp tại Việt Nam.
        
        QUY TẮC:
        1. Nếu khách hàng đưa ra ít thông tin (VD: "500k đi đâu?"), TUYỆT ĐỐI không được gợi ý ngay. Hãy đặt ít nhất 2-3 câu hỏi để tìm hiểu:
           - Bạn định đi trong bao nhiêu lâu (1 ngày hay qua đêm)?
           - Bạn đi từ đâu? (Quan trọng để tính phí di chuyển)
           - Bạn thích kiểu đi chill, ăn uống hay check-in sống ảo?
           - Bạn đi một mình hay với ai?
        2. Nếu thông tin đã đủ, hãy gợi ý 2-3 địa danh cụ thể kèm theo lý do vì sao nó hợp với ngân sách đó.
        3. Phân tích ngân sách thực tế cực kỳ khắt khe. Nếu ngân sách quá thấp (VD: 200k), hãy cảnh báo khách và gợi ý những chỗ gần nhà.
        4. Trả về JSON theo cấu trúc:
        {
          "answer": "Câu trả lời của AI cho khách hàng",
          "suggestions": ["Địa danh 1", "Địa danh 2"], 
          "finalSelection": "Tên địa danh",
          "suggestedBudget": "Không quan tâm hạn mức", // Mặc định nếu khách không nhắc tiền. Hoặc chọn mức phù hợp: "dưới 1 triệu VNĐ", "1 đến 3 triệu VNĐ", "3 đến 7 triệu VNĐ", "7 đến 15 triệu VNĐ", "trên 15 triệu VNĐ"
          "exactBudget": "500.000 VNĐ",
          "isShortTerm": true, // true nếu là đi ăn, đi chơi ngắn trong vài tiếng hoặc trong ngày (bao gồm cả đi chơi đêm rồi về), false nếu là đi du lịch cần thuê chỗ ngủ qua đêm
          "outingTime": "21:00" // Giờ đi nếu khách nhắc tới
        }`
      }
    ];

    // Thêm lịch sử nếu có
    if (history && Array.isArray(history)) {
      history.forEach(h => {
        messages.push({ role: h.role, content: h.content });
      });
    }

    messages.push({ role: 'user', content: message });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      response_format: { type: 'json_object' }
    });

    const aiRes = JSON.parse(response.choices[0].message.content);
    res.json({ success: true, ...aiRes });
  } catch (error) {
    console.error('Discovery API Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi gợi ý AI.' });
  }
});

// Lưu lịch trình theo User ID
router.post('/save', auth, async (req, res) => {
  try {
    const { itineraryId } = req.body;
    if (!itineraryId) return res.status(400).json({ success: false, message: 'Mã lịch trình không hợp lệ.' });

    const itin = await Itinerary.findById(itineraryId);
    if (!itin) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình.' });

    // Gắn userId cho itinerary này
    itin.userId = req.user.id;
    await itin.save();

    res.json({ success: true, message: 'Đã lưu lịch trình thành công.' });
  } catch (error) {
    console.error('Planner DB Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lưu thông tin.' });
  }
});

// Lưu lịch trình THỦ CÔNG (từ trang chủ)
router.post('/save-manual', auth, async (req, res) => {
  try {
    const { destination, stops, tripDate } = req.body;
    if (!destination || !stops || !Array.isArray(stops)) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin chuyến đi (Tên hoặc Danh sách điểm).' });
    }

    // Lấy thông tin user
    const userDoc = await User.findById(req.user.id);
    const userName = userDoc ? (userDoc.displayName || userDoc.name) : 'Thành viên';
    const userEmail = userDoc ? userDoc.email : '';

    // Tạo cấu trúc planJson giả định để hiển thị được trong My Trips
    const manualPlanJson = {
      tripSummary: `Lộ trình tự lập với ${stops.length} điểm dừng: ${stops.slice(0, 3).join(', ')}${stops.length > 3 ? '...' : ''}`,
      estimatedCost: 'Tùy theo chi tiêu cá nhân',
      suggestedHotel: 'Tự chọn theo sở thích',
      itinerary: [
        {
          day: "1 (Lộ trình thủ công)",
          activities: stops.map((s, idx) => ({
            time: `${8 + idx}:00`,
            task: `Tham quan: ${s}`,
            location: s,
            cost: '---'
          }))
        }
      ]
    };

    const newItin = new Itinerary({
      destination,
      days: 1, // Lộ trình thủ công mặc định là 1 cụm ngày
      tripDate: tripDate ? new Date(tripDate) : null,
      planJson: manualPlanJson,
      userId: req.user.id,
      userName,
      userEmail
    });

    const savedDoc = await newItin.save();
    await logAction(userEmail, 'user', 'ITINERARY_SAVED_MANUAL', { destination, itineraryId: savedDoc._id });
    res.json({ success: true, message: 'Đã lưu vào danh sách của bạn!', itineraryId: savedDoc._id });
  } catch (error) {
    console.error('Save Manual Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu lịch trình.' });
  }
});

// Lấy danh sách lịch trình của Tôi
router.get('/my-trips', auth, async (req, res) => {
  try {
    // Lấy tất cả lịch trình của user này
    const trips = await Itinerary.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: trips });
  } catch (error) {
    console.error('Planner DB Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách.' });
  }
});

// Lấy chi tiết một lịch trình cụ thể
router.get('/itinerary/:id', optionalAuth, async (req, res) => {
  try {
    const id = req.params.id.trim();
    console.log('Fetching itinerary detail for ID:', id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }
    
    // Tìm bằng query thô để bỏ qua casting phức tạp của Mongoose trên connection khác
    const itin = await Itinerary.findOne({ _id: new mongoose.Types.ObjectId(id) }).lean();

    if (!itin) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình trong cơ sở dữ liệu.' });
    }

    // Kiểm tra quyền truy cập (nếu muốn bảo mật) - hiện tại cho phép xem công khai nếu có link
    res.json({ success: true, data: itin });
  } catch (error) {
    console.error('Fetch Itinerary Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
});

// Cập nhật trạng thái chuyến đi (Hoàn thành, Bỏ lỡ)
router.put('/status/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['planning', 'completed', 'missed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
    }
    const itin = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status },
      { returnDocument: 'after' }
    );
    if (!itin) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi.' });
    res.json({ success: true, message: 'Đã cập nhật trạng thái.', data: itin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// Xóa tạm thời (vào thùng rác)
router.delete('/itinerary/:id', auth, async (req, res) => {
  try {
    const itin = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isDeleted: true },
      { returnDocument: 'after' }
    );
    if (!itin) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi.' });
    res.json({ success: true, message: 'Đã chuyển vào Thùng rác.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// Khôi phục & Lên lịch lại (về Planning và không còn Deleted)
router.put('/restore/:id', auth, async (req, res) => {
  try {
    const itin = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isDeleted: false, status: 'planning' },
      { returnDocument: 'after' }
    );
    if (!itin) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi.' });
    res.json({ success: true, message: 'Đã đưa lại vào danh sách Đang lên lịch.', data: itin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// Xóa vĩnh viễn
router.delete('/permanent/:id', auth, async (req, res) => {
  try {
    const itin = await Itinerary.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!itin) return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi.' });
    res.json({ success: true, message: 'Đã xóa vĩnh viễn.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

module.exports = router;
