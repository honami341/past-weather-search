"use strict";

const REGIONS = [
  ["北海道", ["北海道"]],
  ["東北", ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"]],
  ["関東", ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"]],
  ["甲信越", ["新潟県", "山梨県", "長野県"]],
  ["北陸", ["富山県", "石川県", "福井県"]],
  ["東海", ["岐阜県", "静岡県", "愛知県", "三重県"]],
  ["近畿", ["滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"]],
  ["中国", ["鳥取県", "島根県", "岡山県", "広島県", "山口県"]],
  ["四国", ["徳島県", "香川県", "愛媛県", "高知県"]],
  ["九州・沖縄", ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"]]
];

function renderPrefectureButtons(containerSelector, onSelect) {
  const container = document.querySelector(containerSelector);
  REGIONS.forEach(([region, prefectures]) => {
    const group = document.createElement("div");
    group.className = "region-group";
    const label = document.createElement("p");
    label.className = "region-name";
    label.textContent = region;
    const buttons = document.createElement("div");
    buttons.className = "prefecture-buttons";
    prefectures.forEach((prefecture) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "prefecture-button";
      button.textContent = prefecture.replace(/[都府県]$/, "");
      button.addEventListener("click", () => onSelect(prefecture));
      buttons.append(button);
    });
    group.append(label, buttons);
    container.append(group);
  });
}

const recentState = { prefecture: null };

function setRecentView(name, shouldScroll = true) {
  document.querySelector("#recent-prefecture-view").classList.toggle("is-hidden", name !== "prefecture");
  document.querySelector("#recent-station-view").classList.toggle("is-hidden", name !== "station");
  document.querySelectorAll("[data-recent-step]").forEach((step) => {
    step.classList.toggle("is-active", Number(step.dataset.recentStep) <= (name === "station" ? 2 : 1));
  });
  if (shouldScroll) document.querySelector("#recent").scrollIntoView({ behavior: "smooth", block: "start" });
}

function selectRecentPrefecture(prefecture) {
  recentState.prefecture = prefecture;
  document.querySelector("#recent-selected-prefecture").textContent = prefecture;
  document.querySelector("#recent-station-search").value = "";
  renderRecentStations();
  setRecentView("station");
}

function buildRecentUrl(station) {
  const hash = new URLSearchParams({
    amdno: station.amd,
    format: "table1h",
    elems: "53414"
  });
  return `https://www.jma.go.jp/bosai/amedas/#${hash}`;
}

function renderRecentStations(query = "") {
  const normalized = query.trim().toLocaleLowerCase("ja");
  const allStations = CURRENT_STATIONS.filter((station) => station.prefecture === recentState.prefecture);
  const stations = allStations.filter((station) => `${station.name} ${station.area}`.toLocaleLowerCase("ja").includes(normalized));
  const list = document.querySelector("#recent-station-list");
  list.replaceChildren();
  document.querySelector("#recent-station-count").textContent = `${allStations.length}地点`;
  document.querySelector("#recent-station-empty").classList.toggle("is-hidden", stations.length !== 0);
  stations.forEach((station) => {
    const link = document.createElement("a");
    link.className = "station-button recent-station-button";
    link.href = buildRecentUrl(station);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `${station.name}の直近3日間の観測を見る`);
    const text = document.createElement("span");
    text.textContent = station.name;
    if (station.area && ["北海道", "沖縄県"].includes(station.prefecture)) {
      const small = document.createElement("small");
      small.textContent = station.area;
      text.append(small);
    }
    link.append(text);
    list.append(link);
  });
}

renderPrefectureButtons("#recent-region-list", selectRecentPrefecture);
document.querySelector("#recent-station-search").addEventListener("input", (event) => renderRecentStations(event.target.value));
document.querySelector("[data-recent-back]").addEventListener("click", () => {
  recentState.prefecture = null;
  setRecentView("prefecture");
});

const archiveViews = {
  prefecture: document.querySelector("#archive-prefecture-view"),
  station: document.querySelector("#archive-station-view"),
  date: document.querySelector("#archive-date-view")
};
const archiveState = { prefecture: null, station: null };
const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function setArchiveView(name, shouldScroll = true) {
  Object.entries(archiveViews).forEach(([key, element]) => element.classList.toggle("is-hidden", key !== name));
  const activeStep = { prefecture: 1, station: 2, date: 3 }[name];
  document.querySelectorAll("[data-archive-step]").forEach((step) => {
    step.classList.toggle("is-active", Number(step.dataset.archiveStep) <= activeStep);
  });
  if (shouldScroll) document.querySelector("#archive").scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateArchiveUrl() {
  const url = new URL(window.location.href);
  archiveState.prefecture ? url.searchParams.set("pref", archiveState.prefecture) : url.searchParams.delete("pref");
  archiveState.station ? url.searchParams.set("station", archiveState.station.block) : url.searchParams.delete("station");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function selectArchivePrefecture(prefecture, shouldScroll = true) {
  archiveState.prefecture = prefecture;
  archiveState.station = null;
  document.querySelector("#archive-selected-prefecture").textContent = prefecture;
  document.querySelector("#archive-station-search").value = "";
  renderArchiveStations();
  updateArchiveUrl();
  setArchiveView("station", shouldScroll);
}

function renderArchiveStations(query = "") {
  const normalized = query.trim().toLocaleLowerCase("ja");
  const allStations = STATIONS.filter((station) => station.prefecture === archiveState.prefecture);
  const stations = allStations.filter((station) => `${station.name} ${station.area || ""}`.toLocaleLowerCase("ja").includes(normalized));
  const list = document.querySelector("#archive-station-list");
  list.replaceChildren();
  document.querySelector("#archive-station-count").textContent = `${allStations.length}地点`;
  document.querySelector("#archive-station-empty").classList.toggle("is-hidden", stations.length !== 0);
  stations.forEach((station) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "station-button";
    const text = document.createElement("span");
    text.textContent = station.name;
    if (station.area && ["北海道", "沖縄県"].includes(station.prefecture)) {
      const small = document.createElement("small");
      small.textContent = station.area;
      text.append(small);
    }
    button.append(text);
    button.addEventListener("click", () => selectArchiveStation(station));
    list.append(button);
  });
}

function selectArchiveStation(station, shouldScroll = true) {
  archiveState.station = station;
  document.querySelector("#archive-summary-prefecture").textContent = archiveState.prefecture;
  document.querySelector("#archive-summary-station").textContent = `${station.name} 観測所`;
  updateArchiveJmaLink();
  updateArchiveUrl();
  setArchiveView("date", shouldScroll);
}

function updateArchiveJmaLink() {
  if (!archiveState.station) return;
  const [year, month, day] = document.querySelector("#archive-weather-date").value.split("-");
  const params = new URLSearchParams({
    prec_no: archiveState.station.prec,
    block_no: archiveState.station.block,
    year: year || "",
    month: month || "",
    day: day || "",
    view: ""
  });
  document.querySelector("#archive-jma-link").href = `https://www.data.jma.go.jp/stats/etrn/index.php?${params}`;
}

renderPrefectureButtons("#archive-region-list", selectArchivePrefecture);
document.querySelector("#archive-station-search").addEventListener("input", (event) => renderArchiveStations(event.target.value));
document.querySelector("#archive-weather-date").value = localToday;
document.querySelector("#archive-weather-date").max = localToday;
document.querySelector("#archive-weather-date").addEventListener("change", updateArchiveJmaLink);
document.querySelector('[data-archive-back="prefecture"]').addEventListener("click", () => {
  archiveState.prefecture = null;
  archiveState.station = null;
  updateArchiveUrl();
  setArchiveView("prefecture");
});
document.querySelector('[data-archive-back="station"]').addEventListener("click", () => {
  archiveState.station = null;
  updateArchiveUrl();
  setArchiveView("station");
});

const initialParams = new URLSearchParams(window.location.search);
const initialPrefecture = initialParams.get("pref");
const initialStation = initialParams.get("station");
if (REGIONS.some(([, prefectures]) => prefectures.includes(initialPrefecture))) {
  selectArchivePrefecture(initialPrefecture, false);
  const station = STATIONS.find((item) => item.prefecture === initialPrefecture && item.block === initialStation);
  if (station) selectArchiveStation(station, false);
}
