/****************************************************
 * DAPLIAN ELEMENTARY SCHOOL iCSM — FRONTEND
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbxBTjj-kvxskVgiY4ZIAfHTXO-41OBooGzZXpPQsPQ2jA8IEuF8zWV9BdvWMlrLXQ6b/exec";

// Add the actual DES iApps Dashboard URL here when available.
const DASHBOARD_URL = "https://113866daplianes.github.io/ides-apps-hub/";

let apiOnline = false;
let activePicker = null;
let thankYouTimer = null;
let countdownValue = 5;
let adminSessionToken = null;

const clientTypeChoices = [
  "Citizen",
  "Business",
  "Government (Employee or another agency)"
];
const sexChoices = ["Male", "Female"];
const serviceChoices = [
  "4Ps Certification",
  "Certificate of Completion",
  "Certificate of Enrollment",
  "Certificate of Transfer / Good Standing",
  "Certification of Good Moral Character",
  "Certification of Grades",
  "Certification of Missing Form 137",
  "Form 9 & 10 Release",
  "Other Transactions",
  "School Inquiry",
  "School Records Request"
];
const cc1Choices = [
  "I know what a CC is and I saw this office's CC.",
  "I know what a CC is but I did NOT see this office's CC.",
  "I learned of the CC only when I saw this office's CC.",
  "I do not know what a CC is and I did not see one in this office."
];
const cc2Choices = ["Easy to see", "Somewhat easy to see", "Difficult to see", "Not visible at all", "N/A"];
const cc3Choices = ["Helped very much", "Somewhat helped", "Did not help", "N/A"];

const sqdQuestions = [
  "I am satisfied with the service that I availed.",
  "I spent a reasonable amount of time for my transaction.",
  "The office followed the transaction's requirements and steps based on the information provided.",
  "The steps (including payment) I needed to do for my transaction were easy and simple.",
  "I easily found information about my transaction from the office or its website.",
  "I paid a reasonable amount of fees for my transaction.",
  "I feel the office was fair to everyone, or “walang palakasan”, during my transaction.",
  "I was treated courteously by the staff, and (if asked for help) the staff was helpful.",
  "I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me."
];
const ratingChoices = [
  { emoji: "😀", label: "Strongly Agree" },
  { emoji: "😊", label: "Agree" },
  { emoji: "😐", label: "Neither Agree nor Disagree" },
  { emoji: "😞", label: "Disagree" },
  { emoji: "😭", label: "Strongly Disagree" },
  { emoji: "🤔", label: "Not Applicable" }
];

async function apiRequest(action, data = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, data })
  });
  if (!response.ok) throw new Error(`API request failed (HTTP ${response.status}).`);
  const payload = await response.json();
  if (!payload || typeof payload !== "object") throw new Error("The API returned an invalid response.");
  if (payload.success !== true) throw new Error(payload.message || "The API could not process the request.");
  if (payload.result && payload.result.success === false) {
    throw new Error(payload.result.message || "The survey was not submitted.");
  }
  return payload.result ?? payload;
}

async function checkApiConnection() {
  const notice = document.getElementById("developmentNotice");
  const proceed = document.getElementById("proceedButton");
  try {
    const response = await fetch(`${API_URL}?action=ping`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.success !== true || data.status !== "API ONLINE") throw new Error("Unexpected API response.");
    apiOnline = true;
    notice.textContent = "System connection verified. You may proceed.";
    notice.classList.add("api-online");
    notice.classList.remove("api-offline");
  } catch (error) {
    console.error("iCSM API connection:", error);
    apiOnline = false;
    notice.textContent = "Unable to connect to the iCSM server. Please check your internet connection or contact the school administrator.";
    notice.classList.add("api-offline");
    notice.classList.remove("api-online");
  }
  notice.style.display = "inline-block";
  updateProceedButton();
}

function updateProceedButton() {
  const consent = document.getElementById("consentCheckbox");
  const button = document.getElementById("proceedButton");
  if (!consent || !button) return;
  button.disabled = !consent.checked || !apiOnline;
  document.getElementById("buttonHint").textContent = !consent.checked
    ? "Please read the notice and provide your consent to continue."
    : apiOnline
      ? "Thank you. You may now proceed."
      : "Waiting for a connection to the iCSM server.";
}

function showScreen(screen) {
  document.getElementById("welcomeScreen").hidden = screen !== "welcome";
  document.getElementById("csmScreen").hidden = screen !== "survey";
  document.getElementById("successScreen").hidden = screen !== "success";
  document.getElementById("adminLoginScreen").hidden = screen !== "adminLogin";
  document.getElementById("adminDashboardScreen").hidden = screen !== "adminDashboard";
  // The dashboard shortcut and discreet admin entry are welcome-screen only.
  document.getElementById("appHeader").hidden = screen !== "welcome";
  window.scrollTo({ top: 0, behavior: "instant" });
}

function setTodayDate() {
  const now = new Date();
  const localDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
  document.getElementById("surveyDate").value = localDate;
  document.getElementById("surveyDateDisplay").textContent =
    now.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function startSurvey() {
  if (!apiOnline || !document.getElementById("consentCheckbox").checked) return;
  setTodayDate();
  showScreen("survey");
  showSurveyPage("client");
}

function showSurveyPage(page) {
  const pages = ["client", "cc", "sqd", "feedback"];
  pages.forEach(name => {
    document.getElementById(`surveyPage${name[0].toUpperCase()}${name.slice(1)}`).hidden = name !== page;
    const dot = document.querySelector(`[data-page-dot="${name}"]`);
    dot.classList.toggle("active", name === page);
    dot.classList.toggle("done", pages.indexOf(name) < pages.indexOf(page));
  });
  window.scrollTo({ top: 0, behavior: "instant" });
}

function openPicker(type) {
  activePicker = type;
  const choices = type === "clientType"
    ? clientTypeChoices
    : type === "sex"
      ? sexChoices
      : serviceChoices;
  document.getElementById("pickerTitle").textContent =
    type === "clientType" ? "Choose Client Type" :
    type === "sex" ? "Choose Sex" : "Choose Service Availed";
  const container = document.getElementById("pickerOptions");
  container.innerHTML = "";
  choices.forEach(choice => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "picker-option";
    button.textContent = choice;
    button.addEventListener("click", () => {
      document.getElementById(type).value = choice;
      document.getElementById(`${type}Picker`).innerHTML = `${escapeHtml(choice)} <span>⌄</span>`;
      closePicker();
    });
    container.appendChild(button);
  });
  document.getElementById("pickerOverlay").hidden = false;
}

function closePicker() {
  document.getElementById("pickerOverlay").hidden = true;
  activePicker = null;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function renderChoices(containerId, name, choices) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  choices.forEach(choice => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice;
    button.dataset.value = choice;
    button.addEventListener("click", () => {
      container.querySelectorAll(".choice-button").forEach(item => item.classList.remove("selected"));
      button.classList.add("selected");
      container.dataset.value = choice;
      if (name === "cc1") handleCC1Change(choice);
    });
    container.appendChild(button);
  });
}

function handleCC1Change(value) {
  const notAware = value === cc1Choices[3];
  document.getElementById("cc2Field").hidden = notAware;
  document.getElementById("cc3Field").hidden = notAware;
  if (notAware) {
    document.getElementById("cc2Options").dataset.value = "N/A";
    document.getElementById("cc3Options").dataset.value = "N/A";
    document.querySelectorAll("#cc2Options .choice-button,#cc3Options .choice-button")
      .forEach(button => button.classList.remove("selected"));
  } else {
    if (document.getElementById("cc2Options").dataset.value === "N/A") delete document.getElementById("cc2Options").dataset.value;
    if (document.getElementById("cc3Options").dataset.value === "N/A") delete document.getElementById("cc3Options").dataset.value;
  }
}

function renderAllSqdQuestions() {
  const container = document.getElementById("sqdAllQuestions");
  container.innerHTML = "";
  sqdQuestions.forEach((question, index) => {
    const card = document.createElement("article");
    card.className = "sqd-question";
    card.innerHTML = `<h4><span>SQD${index}</span> · ${escapeHtml(question)}</h4><div class="rating-options" data-sqd="${index}"></div>`;
    const options = card.querySelector(".rating-options");
    ratingChoices.forEach(choice => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rating-option";
      button.innerHTML = `<span class="emoji">${choice.emoji}</span><small>${escapeHtml(choice.label)}</small>`;
      button.setAttribute("aria-label", `SQD${index}: ${choice.label}`);
      button.addEventListener("click", () => {
        options.querySelectorAll(".rating-option").forEach(item => item.classList.remove("selected"));
        button.classList.add("selected");
        options.dataset.value = choice.emoji;
      });
      options.appendChild(button);
    });
    container.appendChild(card);
  });
}

function showError(id, message) {
  const element = document.getElementById(id);
  element.textContent = message;
  element.hidden = false;
}
function clearError(id) {
  const element = document.getElementById(id);
  element.textContent = "";
  element.hidden = true;
}

function validateClientPage() {
  clearError("clientPageError");
  if (!document.getElementById("clientType").value) return showError("clientPageError", "Please select your client type."), false;
  if (!document.getElementById("sex").value) return showError("clientPageError", "Please select your sex."), false;
  const age = Number(document.getElementById("age").value);
  if (!Number.isInteger(age) || age < 1 || age > 120) return showError("clientPageError", "Please enter a valid age from 1 to 120."), false;
  if (!document.getElementById("address").value.trim()) return showError("clientPageError", "Please enter your address."), false;
  if (!document.getElementById("serviceAvailed").value) return showError("clientPageError", "Please select the service you availed."), false;
  return true;
}

function validateCcPage() {
  clearError("ccPageError");
  if (!document.getElementById("cc1Options").dataset.value) return showError("ccPageError", "Please answer CC1."), false;
  const notAware = document.getElementById("cc1Options").dataset.value === cc1Choices[3];
  if (!notAware && !document.getElementById("cc2Options").dataset.value) return showError("ccPageError", "Please answer CC2."), false;
  if (!notAware && !document.getElementById("cc3Options").dataset.value) return showError("ccPageError", "Please answer CC3."), false;
  return true;
}

function validateSqdPage() {
  clearError("sqdPageError");
  for (let i = 0; i < 9; i++) {
    if (!document.querySelector(`[data-sqd="${i}"]`).dataset.value) {
      showError("sqdPageError", `Please select a response for SQD${i}.`);
      return false;
    }
  }
  return true;
}

async function submitCsm(event) {
  event.preventDefault();
  clearError("feedbackPageError");
  const button = document.getElementById("submitCsmButton");
  button.disabled = true;
  button.textContent = "Submitting…";

  const data = {
    clientType: document.getElementById("clientType").value,
    date: document.getElementById("surveyDate").value,
    sex: document.getElementById("sex").value,
    age: document.getElementById("age").value,
    regionOfResidence: document.getElementById("address").value.trim(),
    serviceAvailed: document.getElementById("serviceAvailed").value.trim(),
    cc1: document.getElementById("cc1Options").dataset.value,
    cc2: document.getElementById("cc2Options").dataset.value || "",
    cc3: document.getElementById("cc3Options").dataset.value || "",
    suggestions: document.getElementById("suggestions").value.trim(),
    emailAddress: document.getElementById("emailAddress").value.trim()
  };
  for (let i = 0; i < 9; i++) data[`sqd${i}`] = document.querySelector(`[data-sqd="${i}"]`).dataset.value;

  try {
    const result = await apiRequest("submitCSMResponse", data);
    document.getElementById("controlNumberValue").textContent = result.controlNumber || "Submitted";
    showScreen("success");
    startThankYouCountdown();
  } catch (error) {
    console.error("iCSM submission:", error);
    showError("feedbackPageError", error.message || "Unable to submit your survey. Please try again.");
    button.disabled = false;
    button.textContent = "Submit Survey ✓";
  }
}

function startThankYouCountdown() {
  clearInterval(thankYouTimer);
  countdownValue = 5;
  document.getElementById("thankYouCountdown").textContent = countdownValue;
  thankYouTimer = setInterval(() => {
    countdownValue -= 1;
    document.getElementById("thankYouCountdown").textContent = countdownValue;
    if (countdownValue <= 0) returnToDashboard();
  }, 1000);
}

function returnToDashboard() {
  clearInterval(thankYouTimer);
  window.location.href = DASHBOARD_URL;
}

function resetKioskToWelcome() {
  clearInterval(thankYouTimer);
  thankYouTimer = null;
  document.getElementById("csmForm").reset();
  document.getElementById("address").value = "Daplian, San Fernando";
  document.getElementById("consentCheckbox").checked = false;
  document.getElementById("clientType").value = "";
  document.getElementById("sex").value = "";
  document.getElementById("clientTypePicker").innerHTML = 'Choose client type <span>⌄</span>';
  document.getElementById("sexPicker").innerHTML = 'Choose sex <span>⌄</span>';
  document.getElementById("serviceAvailedPicker").innerHTML = 'Choose service availed <span>⌄</span>';
  ["cc1Options","cc2Options","cc3Options"].forEach(id => {
    const el = document.getElementById(id);
    delete el.dataset.value;
    el.querySelectorAll("button").forEach(button => button.classList.remove("selected"));
  });
  document.getElementById("cc2Field").hidden = false;
  document.getElementById("cc3Field").hidden = false;
  document.querySelectorAll(".rating-options").forEach(el => {
    delete el.dataset.value;
    el.querySelectorAll("button").forEach(button => button.classList.remove("selected"));
  });
  ["clientPageError","ccPageError","sqdPageError","feedbackPageError"].forEach(clearError);
  document.getElementById("submitCsmButton").disabled = false;
  document.getElementById("submitCsmButton").textContent = "Submit Survey ✓";
  document.getElementById("consentCheckbox").checked = false;
  showScreen("welcome");
  updateProceedButton();
}

async function openAdminLogin() {
  clearError("adminLoginError");
  document.getElementById("adminPinInput").value = "";
  showScreen("adminLogin");
  document.getElementById("adminPinInput").focus();
}

async function submitAdminLogin(event) {
  event.preventDefault();
  const pinInput = document.getElementById("adminPinInput");
  const button = document.getElementById("adminLoginButton");
  clearError("adminLoginError");
  const pin = pinInput.value.trim();
  if (!/^\d{6,12}$/.test(pin)) {
    showError("adminLoginError", "Please enter the administrator PIN.");
    return;
  }
  button.disabled = true;
  button.textContent = "Verifying…";
  try {
    const result = await apiRequest("adminLogin", { pin });
    if (!result || !result.token) throw new Error("The server did not issue an administrator session.");
    adminSessionToken = result.token;
    pinInput.value = "";
    showScreen("adminDashboard");
    await loadAdminOverview();
  } catch (error) {
    showError("adminLoginError", error.message || "Unable to verify administrator access.");
    pinInput.value = "";
    pinInput.focus();
  } finally {
    button.disabled = false;
    button.textContent = "Unlock Admin Dashboard";
  }
}


function selectedAnalyticsFilters() {
  return {
    year: Number(document.getElementById("analyticsYear").value),
    periodType: document.getElementById("analyticsPeriodType").value,
    period: document.getElementById("analyticsPeriod").value
  };
}

function configureAnalyticsPeriodOptions() {
  const type = document.getElementById("analyticsPeriodType").value;
  const wrap = document.getElementById("analyticsPeriodWrap");
  const select = document.getElementById("analyticsPeriod");
  wrap.hidden = type === "all";
  const options = type === "quarter"
    ? [["1", "Q1 · January–March"], ["2", "Q2 · April–June"], ["3", "Q3 · July–September"], ["4", "Q4 · October–December"]]
    : [["1", "January"], ["2", "February"], ["3", "March"], ["4", "April"], ["5", "May"], ["6", "June"], ["7", "July"], ["8", "August"], ["9", "September"], ["10", "October"], ["11", "November"], ["12", "December"]];
  select.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  if (type === "quarter") {
    const month = new Date().getMonth() + 1;
    select.value = String(Math.ceil(month / 3));
  } else if (type === "month") select.value = String(new Date().getMonth() + 1);
}

function formatCount(value) { return Number(value || 0).toLocaleString("en-PH"); }
function safeText(value) { return escapeHtml(String(value === null || value === undefined ? "" : value)); }

function renderMetricRows(object, total) {
  const entries = Object.entries(object || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return `<p class="analytics-empty">No data available for this period.</p>`;
  return `<div class="analytics-metric-list">${entries.map(([label, count]) => {
    const percent = total ? Math.round(count / total * 100) : 0;
    return `<div class="analytics-metric-row"><div class="analytics-metric-label"><span>${safeText(label)}</span><b>${formatCount(count)} <small>${percent}%</small></b></div><div class="analytics-track"><span style="width:${percent}%"></span></div></div>`;
  }).join("")}</div>`;
}

function renderDonut(object, total) {
  const entries = Object.entries(object || {}).filter(([, value]) => Number(value) > 0).sort((a, b) => b[1] - a[1]);
  if (!entries.length || !total) return `<p class="analytics-empty">No data available for this period.</p>`;
  const colors = ["#e97822", "#f5b45e", "#7b9db7", "#70a982", "#c58aaf", "#9a9da5"];
  let offset = 0;
  const stops = entries.map(([label, value], index) => {
    const start = offset;
    offset += value / total * 100;
    return `${colors[index % colors.length]} ${start}% ${offset}%`;
  });
  return `<div class="donut-layout"><div class="analytics-donut" style="background:conic-gradient(${stops.join(",")})"><div><b>${formatCount(total)}</b><small>responses</small></div></div><div class="donut-legend">${entries.map(([label, value], index) => `<div><i style="background:${colors[index % colors.length]}"></i><span>${safeText(label)}</span><b>${formatCount(value)}</b></div>`).join("")}</div></div>`;
}

function renderAssessment(items) {
  const icons = { positive: "✓", watch: "◷", priority: "!", info: "i" };
  return (items || []).map(item => `<article class="assessment-card assessment-${safeText(item.level)}"><span class="assessment-icon">${icons[item.level] || "i"}</span><div><h4>${safeText(item.title)}</h4><p>${safeText(item.message)}</p></div></article>`).join("");
}

function renderTrend(items) {
  if (!items || !items.length) return `<p class="analytics-empty">No response trend available.</p>`;
  const max = Math.max(1, ...items.map(item => item.count));
  return `<div class="trend-bars">${items.map(item => `<div class="trend-column"><div class="trend-value">${item.count || ""}</div><div class="trend-bar-track"><span style="height:${Math.max(item.count ? 5 : 0, item.count / max * 100)}%"></span></div><small>${safeText(item.label)}</small></div>`).join("")}</div>`;
}

function renderSqd(items) {
  if (!items || !items.some(item => item.average !== null)) return `<p class="analytics-empty">No valid SQD ratings are available for this period.</p>`;
  return items.map(item => {
    const avg = item.average;
    const width = avg === null ? 0 : Math.max(0, Math.min(100, avg / 5 * 100));
    const state = avg === null ? "unrated" : avg < 3 ? "low" : avg < 4 ? "moderate" : "good";
    return `<div class="sqd-rating-card"><div class="sqd-rating-top"><b>${safeText(item.key)}</b><strong>${avg === null ? "—" : avg.toFixed(2)}<small>/5</small></strong></div><div class="analytics-track sqd-track ${state}"><span style="width:${width}%"></span></div><div class="sqd-rating-bottom"><span>${formatCount(item.total)} rated</span><span>${formatCount(item.counts["N/A"])} N/A</span></div><div class="sqd-distribution">${[5,4,3,2,1].map(n => `<span title="${n}: ${item.counts[String(n)]}" style="height:${Math.max(3,item.counts[String(n)] / Math.max(1,...[1,2,3,4,5].map(v=>item.counts[String(v)]))*28)}px"></span>`).join("")}</div></div>`;
  }).join("");
}

function renderOverview(data) {
  document.getElementById("analyticsDateRange").textContent = `Showing ${data.period.start} to ${data.period.end} · ${formatCount(data.totalResponses)} response(s)`;
  const overall = data.overallSqdAverage === null ? "—" : data.overallSqdAverage.toFixed(2);
  const citizens = data.clientTypes?.Citizen || 0;
  const government = Object.entries(data.clientTypes || {}).filter(([key]) => key.toLowerCase().includes("government")).reduce((sum, [, value]) => sum + value, 0);
  document.getElementById("analyticsKpis").innerHTML = `
    <article class="analytics-kpi"><span>Total Responses</span><strong>${formatCount(data.totalResponses)}</strong><small>Submitted surveys</small></article>
    <article class="analytics-kpi"><span>Overall SQD Average</span><strong>${overall}<em>/5</em></strong><small>${data.overallSqdAverage === null ? "No ratings yet" : "Across valid SQD ratings"}</small></article>
    <article class="analytics-kpi"><span>Citizen Clients</span><strong>${formatCount(citizens)}</strong><small>Respondents classified as citizens</small></article>
    <article class="analytics-kpi"><span>Government Clients</span><strong>${formatCount(government)}</strong><small>Respondents from government</small></article>`;
  document.getElementById("analyticsAssessment").innerHTML = renderAssessment(data.assessment);
  document.getElementById("analyticsTrend").innerHTML = renderTrend(data.monthly);
  document.getElementById("analyticsClientProfile").innerHTML = `<h4 class="analytics-subheading">Client type</h4>${renderDonut(data.clientTypes, data.totalResponses)}<h4 class="analytics-subheading">Sex</h4>${renderDonut(data.sexes, data.totalResponses)}`;
  document.getElementById("analyticsSqd").innerHTML = renderSqd(data.sqd);
  const cc = data.citizenCharter || {};
  document.getElementById("analyticsCc").innerHTML = ["CC1","CC2","CC3"].map(key => `<h4 class="analytics-subheading">${key}</h4>${renderMetricRows(cc[key], data.totalResponses)}`).join("");
  document.getElementById("analyticsServices").innerHTML = renderMetricRows(Object.fromEntries((data.services || []).map(item => [item.name, item.count])), data.totalResponses);
  document.getElementById("analyticsFeedback").innerHTML = data.suggestions?.length ? `<p class="feedback-count">${formatCount(data.suggestionsCount)} response(s) included written suggestions.</p><ul class="feedback-list">${data.suggestions.map(item => `<li>${safeText(item)}</li>`).join("")}</ul>` : `<p class="analytics-empty">No written suggestions were recorded in this period.</p>`;
  document.getElementById("analyticsDemographics").innerHTML = `<h4 class="analytics-subheading">Age groups</h4>${renderMetricRows(data.ageGroups, data.totalResponses)}`;
  document.getElementById("analyticsLoading").hidden = true;
  document.getElementById("analyticsError").hidden = true;
  document.getElementById("analyticsContent").hidden = false;
}

async function loadAdminOverview() {
  const loading = document.getElementById("analyticsLoading");
  const errorBox = document.getElementById("analyticsError");
  const content = document.getElementById("analyticsContent");
  loading.hidden = false; loading.textContent = "Loading office performance data…";
  errorBox.hidden = true; content.hidden = true;
  try {
    const result = await apiRequest("adminGetOverview", { token: adminSessionToken, filters: selectedAnalyticsFilters() });
    if (!result || result.success !== true) throw new Error("The analytics service returned an invalid response.");
    const yearSelect = document.getElementById("analyticsYear");
    const currentYear = Number(yearSelect.value);
    const years = [...new Set([...(result.availableYears || []), currentYear])].sort((a,b)=>b-a);
    yearSelect.innerHTML = years.map(year => `<option value="${year}">${year}</option>`).join("");
    yearSelect.value = String(currentYear);
    renderOverview(result);
  } catch (err) {
    loading.hidden = true;
    errorBox.textContent = err.message || "Unable to load analytics. Please log in again if your session has expired.";
    errorBox.hidden = false;
    if ((err.message || "").toLowerCase().includes("session")) {
      adminSessionToken = null;
      showScreen("adminLogin");
      showError("adminLoginError", "Your administrator session has expired. Please log in again.");
    }
  }
}

function initializeAnalyticsControls() {
  const yearSelect = document.getElementById("analyticsYear");
  const currentYear = new Date().getFullYear();
  yearSelect.innerHTML = `<option value="${currentYear}">${currentYear}</option>`;
  configureAnalyticsPeriodOptions();
  document.getElementById("analyticsPeriodType").addEventListener("change", () => { configureAnalyticsPeriodOptions(); loadAdminOverview(); });
  document.getElementById("analyticsPeriod").addEventListener("change", loadAdminOverview);
  yearSelect.addEventListener("change", loadAdminOverview);
  document.getElementById("adminRefreshButton").addEventListener("click", loadAdminOverview);
}

async function logoutAdmin() {
  const token = adminSessionToken;
  adminSessionToken = null;
  if (token) {
    try { await apiRequest("adminLogout", { token }); }
    catch (error) { console.warn("Admin logout cleanup:", error); }
  }
  showScreen("welcome");
}

function configureDashboardLink() {
  const link = document.getElementById("dashboardLink");
  link.href = DASHBOARD_URL;
  link.target = "_blank";
  link.rel = "noopener";
}

function initialize() {
  renderChoices("cc1Options", "cc1", cc1Choices);
  renderChoices("cc2Options", "cc2", cc2Choices);
  renderChoices("cc3Options", "cc3", cc3Choices);
  renderAllSqdQuestions();
  configureDashboardLink();
  initializeAnalyticsControls();

  document.getElementById("consentCheckbox").addEventListener("change", updateProceedButton);
  document.getElementById("proceedButton").addEventListener("click", startSurvey);
  document.getElementById("clientTypePicker").addEventListener("click", () => openPicker("clientType"));
  document.getElementById("sexPicker").addEventListener("click", () => openPicker("sex"));
  document.getElementById("serviceAvailedPicker").addEventListener("click", () => openPicker("serviceAvailed"));
  document.getElementById("closePickerButton").addEventListener("click", closePicker);
  document.getElementById("pickerOverlay").addEventListener("click", event => {
    if (event.target.id === "pickerOverlay") closePicker();
  });
  document.getElementById("backToWelcomeButton").addEventListener("click", () => showScreen("welcome"));
  document.getElementById("clientToCcButton").addEventListener("click", () => {
    if (validateClientPage()) showSurveyPage("cc");
  });
  document.getElementById("ccBackButton").addEventListener("click", () => showSurveyPage("client"));
  document.getElementById("ccToSqdButton").addEventListener("click", () => {
    if (validateCcPage()) showSurveyPage("sqd");
  });
  document.getElementById("sqdBackButton").addEventListener("click", () => showSurveyPage("cc"));
  document.getElementById("sqdToFeedbackButton").addEventListener("click", () => {
    if (validateSqdPage()) showSurveyPage("feedback");
  });
  document.getElementById("feedbackBackButton").addEventListener("click", () => showSurveyPage("sqd"));
  document.getElementById("csmForm").addEventListener("submit", submitCsm);
  document.getElementById("returnNowButton").addEventListener("click", returnToDashboard);
  document.getElementById("adminEntryButton").addEventListener("click", openAdminLogin);
  document.getElementById("adminCancelButton").addEventListener("click", () => showScreen("welcome"));
  document.getElementById("adminLoginForm").addEventListener("submit", submitAdminLogin);
  document.getElementById("adminLogoutButton").addEventListener("click", logoutAdmin);
  checkApiConnection();
}

document.addEventListener("DOMContentLoaded", initialize);
