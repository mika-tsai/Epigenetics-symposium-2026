const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector("#mainNav");
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby16BNWFNLwIDFzyuSBuC1rNnD4xtEljustj4Rv6j4sUqvqZfxORj4oc_J0GApGJZKEjw/exec";

const homeHero = document.querySelector("#home");
const forceHomeEntryTop = () => {
  if (!homeHero) return;
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  if (window.location.hash) {
    history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
  }
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  });
};

forceHomeEntryTop();
window.addEventListener("pageshow", forceHomeEntryTop);

document.querySelectorAll("[data-open-new-page]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.open(link.href, "_blank", "noopener,noreferrer");
  });
});

navToggle?.addEventListener("click", () => {
  const isOpen = mainNav?.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
  navToggle.setAttribute("aria-label", isOpen ? "關閉導覽選單" : "開啟導覽選單");
});

const localNavLinks = [...(mainNav?.querySelectorAll('a[href^="#"]') || [])];
const observedSections = localNavLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
let navHighlightLockedUntil = 0;

const setActiveNavLink = (activeId) => {
  localNavLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === activeId;
    link.classList.toggle("current-section", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    const href = link.getAttribute("href") || "";
    if (href.startsWith("#")) {
      setActiveNavLink(href);
      navHighlightLockedUntil = Date.now() + 2400;
    }
    mainNav.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "開啟導覽選單");
  });
});

if ("IntersectionObserver" in window && observedSections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    if (Date.now() < navHighlightLockedUntil) return;

    const visibleSections = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (!visibleSections.length) return;
    const activeId = `#${visibleSections[0].target.id}`;
    setActiveNavLink(activeId);
  }, {
    rootMargin: "-22% 0px -58% 0px",
    threshold: [0, 0.1, 0.35],
  });

  observedSections.forEach((section) => sectionObserver.observe(section));
}

const backToTop = document.querySelector(".back-to-top");
const updateBackToTop = () => {
  backToTop?.classList.toggle("visible", window.scrollY > 700);
};

window.addEventListener("scroll", updateBackToTop, { passive: true });
backToTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
updateBackToTop();

const invitedSpeakerSlider = document.querySelector("#invitedSpeakerSlider");
document.querySelectorAll("[data-speaker-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!invitedSpeakerSlider) return;
    const direction = Number(button.dataset.speakerScroll || 1);
    invitedSpeakerSlider.scrollBy({
      left: invitedSpeakerSlider.clientWidth * 0.78 * direction,
      behavior: "smooth",
    });
  });
});

invitedSpeakerSlider?.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  invitedSpeakerSlider.scrollBy({
    left: invitedSpeakerSlider.clientWidth * 0.78 * (event.key === "ArrowRight" ? 1 : -1),
    behavior: "smooth",
  });
});

const speakerDirectory = document.querySelector("#speakerDirectory");
const speakerSearch = document.querySelector("#speakerSearch");
const speakerFilterButtons = [...document.querySelectorAll("[data-speaker-filter]")];
const speakerResults = document.querySelector("#speakerResults");
let activeSpeakerFilter = "all";

const normalizeSpeakerText = (value) => String(value || "")
  .toLocaleLowerCase("zh-Hant")
  .replace(/\s+/g, " ")
  .trim();

const speakerEntries = speakerDirectory
  ? [...speakerDirectory.querySelectorAll(".speaker-directory-list > :is(div, a)")]
  : [];

speakerEntries.forEach((entry) => {
  const nameElement = entry.querySelector("strong");
  if (!nameElement) return;

  const name = nameElement.textContent.trim();
  const initial = name
    .replace(/^Dr\.\s*/i, "")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const university = entry.closest(".university-entry");
  const group = entry.closest(".speaker-group");
  const institution = university?.querySelector(":scope > header h4")?.textContent ||
    group?.querySelector(":scope > header h3")?.textContent ||
    "";

  const avatar = document.createElement("span");
  avatar.className = "speaker-entry-avatar";
  avatar.setAttribute("aria-hidden", "true");
  if (entry.dataset.photo) {
    const photo = document.createElement("img");
    photo.src = entry.dataset.photo;
    photo.alt = "";
    photo.loading = "lazy";
    photo.decoding = "async";
    if (entry.dataset.photoPosition) {
      photo.style.setProperty("--avatar-position", entry.dataset.photoPosition);
    }
    if (entry.dataset.photoZoom) {
      photo.style.setProperty("--avatar-zoom", entry.dataset.photoZoom);
    }
    if (entry.dataset.photoShiftX) {
      photo.style.setProperty("--avatar-shift-x", entry.dataset.photoShiftX);
    }
    if (entry.dataset.photoShiftY) {
      photo.style.setProperty("--avatar-shift-y", entry.dataset.photoShiftY);
    }
    avatar.append(photo);
  } else {
    avatar.textContent = initial;
  }
  entry.prepend(avatar);
  entry.classList.add("speaker-entry-enhanced");
  entry.dataset.speakerSearch = normalizeSpeakerText(`${entry.textContent} ${institution}`);
});

const updateSpeakerDirectory = () => {
  if (!speakerDirectory) return;
  const query = normalizeSpeakerText(speakerSearch?.value);
  let visibleCount = 0;

  speakerEntries.forEach((entry) => {
    const category = entry.closest(".speaker-group")?.dataset.speakerCategory;
    const matchesCategory = activeSpeakerFilter === "all" || category === activeSpeakerFilter;
    const matchesQuery = !query || entry.dataset.speakerSearch.includes(query);
    const isVisible = matchesCategory && matchesQuery;
    entry.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  speakerDirectory.querySelectorAll(".university-entry").forEach((university) => {
    const hasVisibleSpeaker = [...university.querySelectorAll(".speaker-entry-enhanced")]
      .some((entry) => !entry.hidden);
    university.hidden = !hasVisibleSpeaker;
  });

  speakerDirectory.querySelectorAll(".speaker-group").forEach((group) => {
    const hasVisibleSpeaker = [...group.querySelectorAll(".speaker-entry-enhanced")]
      .some((entry) => !entry.hidden);
    group.hidden = !hasVisibleSpeaker;
  });

  if (speakerResults) {
    speakerResults.textContent = visibleCount
      ? `顯示 ${visibleCount} 位邀請講者`
      : "找不到符合條件的講者，請調整關鍵字或篩選條件。";
  }
};

speakerSearch?.addEventListener("input", updateSpeakerDirectory);
speakerFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeSpeakerFilter = button.dataset.speakerFilter || "all";
    speakerFilterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });
    updateSpeakerDirectory();
  });
});
updateSpeakerDirectory();

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !mainNav?.classList.contains("open")) return;
  mainNav.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", "開啟導覽選單");
  navToggle?.focus();
});

const registrationForm = document.querySelector("#registrationForm");
const planInputs = registrationForm?.querySelectorAll('input[name="registrationPlan"]');
const membershipInputs = registrationForm?.querySelectorAll('input[name="membershipFee"]');
const roommateFields = document.querySelector("#roommateFields");
const roommateName = document.querySelector("#roommateName");
const roommateNameField = document.querySelector("#roommateNameField");
const roommateStatusInputs = registrationForm?.querySelectorAll('input[name="roommateStatus"]');
const positionInputs = registrationForm?.querySelectorAll('input[name="position"]');
const positionOther = document.querySelector("#positionOther");
const amountDisplay = document.querySelector("#amountDisplay");
const amountNote = document.querySelector("#amountNote");
const totalAmount = document.querySelector("#totalAmount");
const submittedAt = document.querySelector("#submittedAt");
const formStatus = document.querySelector("#formStatus");
const submitButton = registrationForm?.querySelector('button[type="submit"]');
const registrationSuccess = document.querySelector("#registrationSuccess");
const successSummary = document.querySelector("#successSummary");
const emailInput = registrationForm?.elements.namedItem("email");
const emailPattern = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const FORM_DRAFT_KEY = "tes-2026-registration-draft";
let pendingRegistrationSummary = [];
let draftSaveTimer;

const formatCurrency = (amount) => `NT$${Number(amount).toLocaleString("zh-TW")}`;

const copyText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temporaryInput = document.createElement("textarea");
  temporaryInput.value = text;
  temporaryInput.setAttribute("readonly", "");
  temporaryInput.style.position = "fixed";
  temporaryInput.style.opacity = "0";
  document.body.appendChild(temporaryInput);
  temporaryInput.select();
  document.execCommand("copy");
  temporaryInput.remove();
};

document.querySelectorAll("[data-copy-account]").forEach((button) => {
  button.addEventListener("click", async () => {
    const originalText = button.textContent;
    try {
      await copyText(button.dataset.copyAccount);
      button.textContent = "已複製";
      button.classList.add("copied");
    } catch {
      button.textContent = "請手動複製";
    }

    window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("copied");
    }, 1800);
  });
});

const saveRegistrationDraft = () => {
  if (!registrationForm) return;
  const draft = {};
  const excludedFields = new Set(["website", "submittedAt", "totalAmount"]);

  [...registrationForm.elements].forEach((field) => {
    if (!field.name || excludedFields.has(field.name) || field.disabled) return;
    if ((field.type === "radio" || field.type === "checkbox") && !field.checked) return;
    draft[field.name] = field.type === "checkbox" ? true : field.value;
  });

  try {
    sessionStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // The form remains fully usable when storage is unavailable.
  }
};

const restoreRegistrationDraft = () => {
  if (!registrationForm) return;

  try {
    const draft = JSON.parse(sessionStorage.getItem(FORM_DRAFT_KEY) || "null");
    if (!draft) return;

    Object.entries(draft).forEach(([name, value]) => {
      [...registrationForm.elements]
        .filter((field) => field.name === name)
        .forEach((field) => {
          if (field.type === "radio") {
            field.checked = field.value === value;
          } else if (field.type === "checkbox") {
            field.checked = Boolean(value);
          } else {
            field.value = value;
          }
        });
    });
  } catch {
    sessionStorage.removeItem(FORM_DRAFT_KEY);
  }
};

const scheduleDraftSave = () => {
  window.clearTimeout(draftSaveTimer);
  draftSaveTimer = window.setTimeout(saveRegistrationDraft, 180);
};

const updateRegistrationAmount = () => {
  const selectedPlan = registrationForm?.querySelector('input[name="registrationPlan"]:checked');
  const selectedMembership = registrationForm?.querySelector('input[name="membershipFee"]:checked');
  const isTwinRoom = selectedPlan?.value === "雙人房";
  const roommateStatus = registrationForm?.querySelector('input[name="roommateStatus"]:checked')?.value;
  const needsRoommateName = isTwinRoom && roommateStatus === "指定另一位會議參加者";

  if (roommateFields) {
    roommateFields.hidden = !isTwinRoom;
  }

  if (roommateName) {
    roommateName.required = needsRoommateName;
    if (!needsRoommateName) roommateName.value = "";
  }

  if (roommateNameField) {
    roommateNameField.hidden = !needsRoommateName;
  }

  roommateStatusInputs?.forEach((input) => {
    input.required = isTwinRoom;
    if (!isTwinRoom) input.checked = false;
  });

  let amount = Number(selectedPlan?.dataset.amount || 3500);
  const membershipAmount = Number(selectedMembership?.dataset.amount || 0);

  if (isTwinRoom && roommateStatus === "未參加會議之家人") {
    amount += 2500;
  }

  amount += membershipAmount;

  if (totalAmount) totalAmount.value = String(amount);
  if (amountDisplay) amountDisplay.textContent = formatCurrency(amount);

  if (amountNote) {
    const membershipNote = membershipAmount > 0 ? `＋${selectedMembership.value}` : "";
    if (selectedPlan?.value === "雙人房" && roommateStatus === "未參加會議之家人") {
      amountNote.textContent = `雙人房方案＋未參加會議之家人${membershipNote}`;
    } else if (selectedPlan?.value === "雙人房" && roommateStatus === "由主辦單位安排") {
      amountNote.textContent = `雙人房方案・由主辦單位安排同住人${membershipNote}`;
    } else if (selectedPlan?.value === "雙人房" && roommateStatus === "指定另一位會議參加者") {
      amountNote.textContent = `雙人房方案・指定會議參加者同住${membershipNote}`;
    } else if (selectedPlan?.value === "雙人房") {
      amountNote.textContent = `雙人房方案${membershipNote}`;
    } else if (selectedPlan?.value === "單人房") {
      amountNote.textContent = `單人房方案${membershipNote}`;
    } else {
      amountNote.textContent = `會員報名，不含住宿${membershipNote}`;
    }
  }
};

planInputs?.forEach((input) => input.addEventListener("change", updateRegistrationAmount));
membershipInputs?.forEach((input) => input.addEventListener("change", updateRegistrationAmount));
roommateStatusInputs?.forEach((input) => input.addEventListener("change", updateRegistrationAmount));

const updatePositionField = () => {
  const isOther = registrationForm?.querySelector('input[name="position"]:checked')?.value === "Other";
  if (!positionOther) return;
  positionOther.hidden = !isOther;
  positionOther.required = isOther;
  if (!isOther) positionOther.value = "";
};

positionInputs?.forEach((input) => input.addEventListener("change", updatePositionField));
restoreRegistrationDraft();
updateRegistrationAmount();
updatePositionField();
registrationForm?.addEventListener("input", scheduleDraftSave);
registrationForm?.addEventListener("change", scheduleDraftSave);
emailInput?.addEventListener("input", () => {
  emailInput.setCustomValidity("");
});

const createRegistrationSummary = () => {
  const value = (name) => registrationForm?.elements.namedItem(name)?.value?.trim() || "";
  const selectedValue = (name) => registrationForm
    ?.querySelector(`input[name="${name}"]:checked`)
    ?.value || "";
  const position = selectedValue("position") === "Other"
    ? value("positionOther")
    : selectedValue("position");
  const plan = selectedValue("registrationPlan");
  const roommateStatus = selectedValue("roommateStatus");
  const summary = [
    ["姓名", `${value("chineseName")} / ${value("englishName")}`],
    ["聯絡信箱", value("email")],
    ["職稱", position],
    ["會員相關費用", selectedValue("membershipFee")],
    ["報名方案", plan],
    ["飲食需求", selectedValue("diet")],
    ["飲食限制", value("dietaryRestrictions") || "無"],
    ["應繳金額", formatCurrency(totalAmount?.value || 0)],
    ["匯款帳號後五碼", value("bankLastFive")],
    ["收據抬頭", value("receiptTitle")],
    ["統一編號", value("taxId") || "無"],
  ];

  if (plan === "雙人房") {
    summary.splice(5, 0, ["雙人房安排", roommateStatus]);
    if (value("roommateName")) {
      summary.splice(6, 0, ["同住人", value("roommateName")]);
    }
  }

  return summary;
};

const renderRegistrationSuccess = (summary) => {
  if (!registrationSuccess || !successSummary) return;

  successSummary.replaceChildren();
  summary.forEach(([label, value]) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    successSummary.appendChild(row);
  });

  registrationSuccess.hidden = false;
  registrationSuccess.scrollIntoView({ behavior: "smooth", block: "start" });
  registrationSuccess.focus({ preventScroll: true });
};

registrationForm?.addEventListener("submit", (event) => {
  if (GOOGLE_APPS_SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) {
    event.preventDefault();
    formStatus.textContent = "表單介面已完成，請先設定 Google Apps Script 部署網址後即可正式送出。";
    return;
  }

  if (emailInput) {
    const emailValue = emailInput.value.trim();
    emailInput.setCustomValidity(emailPattern.test(emailValue) ? "" : "請填寫有效的電子信箱，例如 name@example.com");
  }

  if (!registrationForm.checkValidity()) {
    event.preventDefault();
    registrationForm.reportValidity();
    return;
  }

  submittedAt.value = new Date().toISOString();
  pendingRegistrationSummary = createRegistrationSummary();
  registrationForm.action = GOOGLE_APPS_SCRIPT_URL;
  formStatus.textContent = "資料送出中，請稍候…";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "資料送出中…";
  }
});

const submissionFrame = document.querySelector("#registrationSubmitFrame");
let submissionTimeout;
let submissionInProgress = false;
let submissionMessageReceived = false;

registrationForm?.addEventListener("submit", (event) => {
  if (event.defaultPrevented || GOOGLE_APPS_SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) return;
  window.clearTimeout(submissionTimeout);
  submissionInProgress = true;
  submissionMessageReceived = false;
  submissionTimeout = window.setTimeout(() => {
    formStatus.textContent = "目前無法確認是否送出成功，請勿重複送出，並聯絡秘書處協助確認。";
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "送出報名資料";
    }
  }, 15000);
});

submissionFrame?.addEventListener("load", () => {
  if (!submissionInProgress || submissionMessageReceived) return;

  window.setTimeout(() => {
    if (!submissionInProgress || submissionMessageReceived) return;
    window.clearTimeout(submissionTimeout);
    submissionInProgress = false;
    formStatus.textContent = "報名資料已送出。秘書處將核對會員資格及款項。";
    renderRegistrationSuccess(pendingRegistrationSummary);
    sessionStorage.removeItem(FORM_DRAFT_KEY);
    registrationForm.reset();
    updateRegistrationAmount();
    updatePositionField();
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "送出報名資料";
    }
  }, 2500);
});

window.addEventListener("message", (event) => {
  const isGoogleScriptResponse = /^https:\/\/([a-z0-9-]+\.)?(script\.google\.com|googleusercontent\.com)$/i.test(event.origin);
  if (event.data?.source !== "tes-registration" || !isGoogleScriptResponse) return;
  submissionMessageReceived = true;
  submissionInProgress = false;
  window.clearTimeout(submissionTimeout);

  if (event.data.ok) {
    formStatus.textContent = "報名資料已送出。請等待秘書處確認會員資格及款項。";
    renderRegistrationSuccess(pendingRegistrationSummary);
    sessionStorage.removeItem(FORM_DRAFT_KEY);
    registrationForm.reset();
    updateRegistrationAmount();
    updatePositionField();
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "送出報名資料";
    }
    return;
  }

  formStatus.textContent = event.data.message || "資料未送出，請檢查欄位後再試一次。";
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = "送出報名資料";
  }
});
