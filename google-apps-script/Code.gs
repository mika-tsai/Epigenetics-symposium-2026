const SPREADSHEET_ID = '1qkVbyNd1bf3RaXT6AaeHGXEUhh_qM9Xszcj7ii8SlQ0';
const SHEET_NAME = '報名資料';
const POSITION_OPTIONS = ['PI', 'Postdoc', 'Student', 'Research Assistant', 'Other'];
const DIET_OPTIONS = ['Regular（葷）', 'Vegetarian（素）'];
const MEMBERSHIP_FEES = {
  '不一併繳納': 0,
  '個人新入會（入會費＋年費）': 1200,
  '學生新入會（入會費＋年費）': 500,
  '個人年費': 500,
  '學生年費': 200
};

function doPost(e) {
  try {
    const data = e && e.parameter ? e.parameter : {};
    validateRegistration_(data);

    const registrationAmount = calculateRegistrationTotal_(data.registrationPlan, data.roommateStatus);
    const membershipAmount = calculateMembershipTotal_(data.membershipFee);
    const totalAmount = registrationAmount + membershipAmount;
    const position = data.position === 'Other' ? data.positionOther : data.position;
    const registrationId = createRegistrationId_();
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const sheet = getRegistrationSheet_();
      sheet.appendRow([
        new Date(),
        safeCell_(data.submittedAt),
        safeCell_(data.chineseName),
        safeCell_(data.englishName),
        safeCell_(data.email),
        safeCell_(position),
        safeCell_(data.membershipFee),
        membershipAmount,
        safeCell_(data.registrationPlan),
        registrationAmount,
        totalAmount,
        safeCell_(data.roommateName),
        safeCell_(data.roommateStatus),
        safeCell_(data.diet),
        safeCell_(data.dietaryRestrictions),
        safeCell_(data.bankLastFive),
        safeCell_(data.receiptTitle),
        safeCell_(data.taxId),
        safeCell_(data.consent),
        '待確認',
        registrationId
      ]);
    } finally {
      lock.releaseLock();
    }

    return response_(true, '報名資料已收到。', {
      registrationId: registrationId
    });
  } catch (error) {
    return response_(false, error.message || '資料格式不正確，請重新確認。');
  }
}

function getRegistrationSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.getSheets()[0] || spreadsheet.insertSheet();
    sheet.setName(SHEET_NAME);
  }

  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const headers = [
    '系統收件時間',
    '瀏覽器送出時間',
    '中文姓名',
    '英文姓名',
    '聯絡信箱',
    '職稱',
    '會員相關費用',
    '會員費金額',
    '報名方案',
    '報名費金額',
    '應繳金額',
    '指定同住人姓名',
    '雙人房安排方式',
    '飲食選擇',
    '飲食限制',
    '匯款帳號後五碼',
    '收據抬頭',
    '統一編號',
    '個資同意',
    '款項狀態',
    '報名編號'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
}

function validateRegistration_(data) {
  if (data.website) throw new Error('資料未通過驗證。');
  if (!text_(data.chineseName)) throw new Error('請填寫中文姓名。');
  if (!text_(data.englishName)) throw new Error('請填寫英文姓名。');
  if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(text_(data.email))) throw new Error('請填寫有效的聯絡信箱，例如 name@example.com。');
  if (POSITION_OPTIONS.indexOf(data.position) === -1) throw new Error('請選擇職稱。');
  if (data.position === 'Other' && !text_(data.positionOther)) throw new Error('請填寫其他職稱。');
  calculateMembershipTotal_(data.membershipFee);
  calculateRegistrationTotal_(data.registrationPlan, data.roommateStatus);
  if (
    data.registrationPlan === '雙人房' &&
    data.roommateStatus === '指定另一位會議參加者' &&
    !text_(data.roommateName)
  ) {
    throw new Error('請填寫指定同住人姓名。');
  }
  if (DIET_OPTIONS.indexOf(data.diet) === -1) throw new Error('請選擇飲食需求。');
  if (!/^\d{5}$/.test(text_(data.bankLastFive))) throw new Error('匯款帳號後五碼須為 5 位數字。');
  if (!text_(data.receiptTitle)) throw new Error('請填寫收據抬頭。');
  if (data.taxId && !/^\d{8}$/.test(text_(data.taxId))) throw new Error('統一編號須為 8 位數字，無統編可留白。');
  if (data.consent !== '同意') throw new Error('請確認個人資料使用說明。');
}

function calculateMembershipTotal_(membershipFee) {
  if (Object.prototype.hasOwnProperty.call(MEMBERSHIP_FEES, membershipFee)) {
    return MEMBERSHIP_FEES[membershipFee];
  }
  throw new Error('請選擇會員相關費用。');
}

function calculateRegistrationTotal_(plan, roommateStatus) {
  if (plan === '不含住宿') return 3500;
  if (plan === '單人房') return 7000;
  if (plan === '雙人房') {
    if (roommateStatus === '指定另一位會議參加者') return 5000;
    if (roommateStatus === '由主辦單位安排') return 5000;
    if (roommateStatus === '未參加會議之家人') return 7500;
    throw new Error('請選擇雙人房安排方式。');
  }
  throw new Error('請選擇報名方案。');
}

function text_(value) {
  return String(value || '').trim();
}

function safeCell_(value) {
  const cleaned = text_(value).slice(0, 1000);
  return /^[=+\-@]/.test(cleaned) ? "'" + cleaned : cleaned;
}

function createRegistrationId_() {
  const date = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMdd');
  const suffix = Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
  return 'TES26-' + date + '-' + suffix;
}

function response_(ok, message, extra) {
  const responseData = {
    source: 'tes-registration',
    ok: ok,
    message: message
  };

  if (extra) {
    Object.keys(extra).forEach(function(key) {
      responseData[key] = extra[key];
    });
  }

  const payload = JSON.stringify(responseData).replace(/</g, '\\u003c');

  return HtmlService.createHtmlOutput(
    '<!doctype html><html><body><script>' +
    'window.top.postMessage(' + payload + ', "*");' +
    '</script></body></html>'
  );
}
