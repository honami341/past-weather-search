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

const views = {
  prefecture: document.querySelector("#prefecture-view"),
  station: document.querySelector("#station-view"),
  date: document.querySelector("#date-view")
};
const state = { prefecture: null, station: null };
const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function setView(name, shouldScroll = true) {
  Object.entries(views).forEach(([key, element]) => element.classList.toggle("is-hidden", key !== name));
  const activeStep = { prefecture: 1, station: 2, date: 3 }[name];
  document.querySelectorAll(".step").forEach((step) => {
    step.classList.toggle("is-active", Number(step.dataset.step) <= activeStep);
  });
  if (shouldScroll) document.querySelector(".finder").scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateUrl() {
  const url = new URL(window.location.href);
  state.prefecture ? url.searchParams.set("pref", state.prefecture) : url.searchParams.delete("pref");
  state.station ? url.searchParams.set("station", state.station.block) : url.searchParams.delete("station");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function renderPrefectures() {
  const container = document.querySelector("#region-list");
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
      button.addEventListener("click", () => selectPrefecture(prefecture));
      buttons.append(button);
    });
    group.append(label, buttons);
    container.append(group);
  });
}

function selectPrefecture(prefecture, shouldScroll = true) {
  state.prefecture = prefecture;
  state.station = null;
  document.querySelector("#selected-prefecture").textContent = prefecture;
  document.querySelector("#station-search").value = "";
  renderStations();
  updateUrl();
  setView("station", shouldScroll);
}

function renderStations(query = "") {
  const normalized = query.trim().toLocaleLowerCase("ja");
  const allStations = STATIONS.filter((station) => station.prefecture === state.prefecture);
  const stations = allStations.filter((station) => `${station.name} ${station.area || ""}`.toLocaleLowerCase("ja").includes(normalized));
  const list = document.querySelector("#station-list");
  list.replaceChildren();
  document.querySelector("#station-count").textContent = `${allStations.length}地点`;
  document.querySelector("#station-empty").classList.toggle("is-hidden", stations.length !== 0);
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
    button.addEventListener("click", () => selectStation(station));
    list.append(button);
  });
}

function selectStation(station, shouldScroll = true) {
  state.station = station;
  document.querySelector("#summary-prefecture").textContent = state.prefecture;
  document.querySelector("#summary-station").textContent = `${station.name} 観測所`;
  updateJmaLink();
  updateUrl();
  setView("date", shouldScroll);
}

function updateJmaLink() {
  if (!state.station) return;
  const [year, month, day] = document.querySelector("#weather-date").value.split("-");
  const params = new URLSearchParams({
    prec_no: state.station.prec,
    block_no: state.station.block,
    year: year || "",
    month: month || "",
    day: day || "",
    view: ""
  });
  document.querySelector("#jma-link").href = `https://www.data.jma.go.jp/stats/etrn/index.php?${params}`;
}

document.querySelector("#station-search").addEventListener("input", (event) => renderStations(event.target.value));
document.querySelector("#weather-date").value = localToday;
document.querySelector("#weather-date").max = localToday;
document.querySelector("#weather-date").addEventListener("change", updateJmaLink);
document.querySelector('[data-back="prefecture"]').addEventListener("click", () => {
  state.prefecture = null;
  state.station = null;
  updateUrl();
  setView("prefecture");
});
document.querySelector('[data-back="station"]').addEventListener("click", () => {
  state.station = null;
  updateUrl();
  setView("station");
});

renderPrefectures();

const initialParams = new URLSearchParams(window.location.search);
const initialPrefecture = initialParams.get("pref");
const initialStation = initialParams.get("station");
if (REGIONS.some(([, prefectures]) => prefectures.includes(initialPrefecture))) {
  selectPrefecture(initialPrefecture, false);
  const station = STATIONS.find((item) => item.prefecture === initialPrefecture && item.block === initialStation);
  if (station) selectStation(station, false);
}
