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
  // The dashboard shortcut is displayed only on the main welcome screen.
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
  checkApiConnection();
}

document.addEventListener("DOMContentLoaded", initialize);
