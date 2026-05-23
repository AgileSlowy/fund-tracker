const STORAGE_KEY = "fundTrackerRecords";

let records = [];
let calculatedRecords = [];
let activeTrendChart = "performance";
let activeRange = "week";
let activeProfitRange = "week";
let historyCollapsed = false;
let historyMonthFilter = "";
let detailCollapsed = false;
let detailMonthFilter = "";
let returnChart = null;
let cumulativeProfitChart = null;
let profitChart = null;

const dom = {
  currentAmount: document.getElementById("currentAmount"),
  totalInvested: document.getElementById("totalInvested"),
  cumulativeProfit: document.getElementById("cumulativeProfit"),
  holdingReturn: document.getElementById("holdingReturn"),
  todayProfit: document.getElementById("todayProfit"),
  latestRate: document.getElementById("latestRate"),
  latestDate: document.getElementById("latestDate"),
  recordForm: document.getElementById("recordForm"),
  formTitle: document.getElementById("formTitle"),
  editingDate: document.getElementById("editingDate"),
  date: document.getElementById("date"),
  dailyRate: document.getElementById("dailyRate"),
  deposit: document.getElementById("deposit"),
  withdraw: document.getElementById("withdraw"),
  note: document.getElementById("note"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  trendChartTabs: document.getElementById("trendChartTabs"),
  rangeTabs: document.getElementById("rangeTabs"),
  returnChartEl: document.getElementById("returnChart"),
  cumulativeProfitChartEl: document.getElementById("cumulativeProfitChart"),
  tradeLegend: document.getElementById("tradeLegend"),
  detailPanel: document.getElementById("detailPanel"),
  detailMonth: document.getElementById("detailMonth"),
  clearDetailMonthBtn: document.getElementById("clearDetailMonthBtn"),
  toggleDetailBtn: document.getElementById("toggleDetailBtn"),
  recordTableBody: document.getElementById("recordTableBody"),
  recordCount: document.getElementById("recordCount"),
  historyPanel: document.getElementById("historyPanel"),
  historyMonth: document.getElementById("historyMonth"),
  clearHistoryMonthBtn: document.getElementById("clearHistoryMonthBtn"),
  toggleHistoryBtn: document.getElementById("toggleHistoryBtn"),
  exportBtn: document.getElementById("exportBtn"),
  clearBtn: document.getElementById("clearBtn")
};

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  records = loadRecords();
  calculatedRecords = calculateRecords(records);

  initCharts();
  bindEvents();
  resetForm();
  renderAll();
}

function bindEvents() {
  dom.recordForm.addEventListener("submit", addOrUpdateRecord);
  dom.cancelEditBtn.addEventListener("click", resetForm);
  dom.exportBtn.addEventListener("click", exportCSV);
  dom.clearBtn.addEventListener("click", clearAllRecords);
  dom.toggleHistoryBtn.addEventListener("click", toggleHistoryPanel);
  dom.historyMonth.addEventListener("change", () => {
    historyMonthFilter = dom.historyMonth.value;
    renderTable();
  });
  dom.clearHistoryMonthBtn.addEventListener("click", () => {
    historyMonthFilter = "";
    dom.historyMonth.value = "";
    renderTable();
  });
  dom.toggleDetailBtn.addEventListener("click", toggleDetailPanel);
  dom.detailMonth.addEventListener("change", () => {
    detailMonthFilter = dom.detailMonth.value;
    renderCharts();
  });
  dom.clearDetailMonthBtn.addEventListener("click", () => {
    detailMonthFilter = "";
    dom.detailMonth.value = "";
    renderCharts();
  });

  dom.rangeTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-range]");
    if (!button) return;

    if (activeTrendChart === "performance") {
      activeRange = button.dataset.range;
    } else {
      activeProfitRange = button.dataset.range;
    }

    renderRangeTabs();
    renderCharts();
  });
  dom.trendChartTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-chart]");
    if (!button) return;

    activeTrendChart = button.dataset.chart;
    renderTrendPanel();
  });

  window.addEventListener("resize", debounce(() => {
    returnChart?.resize();
    cumulativeProfitChart?.resize();
    profitChart?.resize();
  }, 120));
}

function loadRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(data)) return [];

    return data
      .filter((item) => item && item.date)
      .map((item) => ({
        date: String(item.date),
        dailyRate: Number(item.dailyRate) || 0,
        deposit: Math.max(0, Number(item.deposit) || 0),
        withdraw: Math.max(0, Number(item.withdraw) || 0),
        note: item.note ? String(item.note) : ""
      }));
  } catch (error) {
    console.warn("读取本地数据失败，已使用空数据。", error);
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function calculateRecords(sourceRecords) {
  const sortedRecords = [...sourceRecords].sort((a, b) => a.date.localeCompare(b.date));
  let previousNetValue = 1;
  let holdingShares = 0;
  let holdingCost = 0;
  let totalDeposit = 0;
  let totalWithdraw = 0;

  return sortedRecords.map((record, index) => {
    const rate = Number(record.dailyRate) || 0;
    const deposit = Number(record.deposit) || 0;
    const withdraw = Number(record.withdraw) || 0;

    totalDeposit += deposit;
    totalWithdraw += withdraw;

    const isFirstRecord = index === 0;
    // 首日如果从追加金额开始建仓，追加金额需要参与当天涨跌；后续追加按当日收盘净值买入。
    if (isFirstRecord && deposit > 0) {
      holdingShares += deposit / previousNetValue;
      holdingCost += deposit;
    }

    const netValue = previousNetValue * (1 + rate);
    const profitBase = holdingShares * previousNetValue;
    const dailyProfit = profitBase * rate;
    let amountBeforeCashFlow = holdingShares * netValue;

    if (!isFirstRecord && deposit > 0) {
      holdingShares += safeDivide(deposit, netValue);
      holdingCost += deposit;
      amountBeforeCashFlow += deposit;
    }

    if (withdraw > 0 && amountBeforeCashFlow > 0) {
      const withdrawRatio = Math.min(withdraw / amountBeforeCashFlow, 1);
      holdingShares -= safeDivide(withdraw, netValue);
      holdingCost *= 1 - withdrawRatio;
    }

    const currentAmount = holdingShares * netValue;

    const totalInvested = totalDeposit - totalWithdraw;
    const cumulativeProfit = currentAmount - totalInvested;
    const holdingProfit = currentAmount - holdingCost;
    const holdingReturn = holdingCost === 0 ? 0 : holdingProfit / holdingCost;

    previousNetValue = netValue;

    return {
      ...record,
      netValue,
      dailyProfit,
      currentAmount,
      totalInvested,
      cumulativeProfit,
      holdingCost,
      holdingProfit,
      holdingReturn
    };
  });
}

function renderAll() {
  calculatedRecords = calculateRecords(records);
  renderSummary();
  renderCharts();
  renderTrendPanel();
  renderHistoryPanel();
  renderDetailPanel();
  renderTable();
}

function renderSummary() {
  const latest = calculatedRecords.at(-1);

  if (!latest) {
    setNeutralValue(dom.currentAmount, formatMoney(0));
    setNeutralValue(dom.totalInvested, formatMoney(0));
    setValue(dom.cumulativeProfit, formatSignedMoney(0), 0);
    setValue(dom.holdingReturn, formatSignedPercent(0), 0);
    setValue(dom.todayProfit, formatSignedMoney(0), 0);
    setValue(dom.latestRate, formatSignedPercent(0), 0);
    dom.latestDate.textContent = "暂无记录";
    return;
  }

  setNeutralValue(dom.currentAmount, formatMoney(latest.currentAmount));
  setNeutralValue(dom.totalInvested, formatMoney(latest.totalInvested));
  setValue(dom.cumulativeProfit, formatSignedMoney(latest.cumulativeProfit), latest.cumulativeProfit);
  setValue(dom.holdingReturn, formatSignedPercent(latest.holdingReturn * 100), latest.holdingReturn);
  setValue(dom.todayProfit, formatSignedMoney(latest.dailyProfit), latest.dailyProfit);
  setValue(dom.latestRate, formatSignedPercent(latest.dailyRate * 100), latest.dailyRate);
  dom.latestDate.textContent = latest.date;
}

function initCharts() {
  returnChart = echarts.init(document.getElementById("returnChart"));
  cumulativeProfitChart = echarts.init(document.getElementById("cumulativeProfitChart"));
  profitChart = echarts.init(document.getElementById("profitChart"));
}

function renderCharts() {
  const rangedRecords = filterRecordsByRange(calculatedRecords, activeRange);
  const dates = rangedRecords.map((item) => item.date);
  const baseNetValue = rangedRecords[0]?.netValue || 1;
  const changePercentData = getRangeChangePercent(rangedRecords, baseNetValue);
  const buyMarks = getTradeMarks(rangedRecords, "buy", baseNetValue);
  const sellMarks = getTradeMarks(rangedRecords, "sell", baseNetValue);
  const percentAxisBounds = getPaddedAxisBounds(changePercentData);

  returnChart.setOption({
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const rows = params.map((item) => {
          if (item.seriesName === "涨跌幅") {
            return `${item.marker}${item.seriesName}: ${Number(item.value).toFixed(2)}%`;
          }

          const record = item.data?.record;
          const amount = item.seriesName === "买入" ? record?.deposit : record?.withdraw;
          const percent = Array.isArray(item.value) ? Number(item.value[1]).toFixed(2) : "0.00";
          return `${item.marker}${item.seriesName}: ${formatMoney(amount)} 元，${percent}%`;
        });

        return `${params[0].axisValue}<br>${rows.join("<br>")}`;
      }
    },
    grid: { left: 46, right: 18, top: 24, bottom: 42 },
    xAxis: {
      type: "category",
      data: dates,
      axisTick: { show: false },
      axisLabel: { color: "#858b96" }
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#858b96",
        formatter: (value) => `${Number(value).toFixed(2)}%`
      },
      min: percentAxisBounds.min,
      max: percentAxisBounds.max,
      splitLine: { lineStyle: { color: "#edf0f3" } }
    },
    series: [
      {
        name: "涨跌幅",
        type: "line",
        data: changePercentData,
        smooth: false,
        symbol: "emptyCircle",
        symbolSize: 8,
        lineStyle: { width: 3, color: "#1677ff" },
        itemStyle: { color: "#1677ff" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(22, 119, 255, 0.18)" },
              { offset: 1, color: "rgba(22, 119, 255, 0.02)" }
            ]
          }
        }
      },
      {
        name: "买入",
        type: "scatter",
        data: buyMarks,
        symbol: "circle",
        symbolSize: 13,
        z: 4,
        itemStyle: {
          color: "#e64545",
          borderColor: "#ffffff",
          borderWidth: 2
        },
        label: {
          show: false
        }
      },
      {
        name: "卖出",
        type: "scatter",
        data: sellMarks,
        symbol: "circle",
        symbolSize: 13,
        z: 4,
        itemStyle: {
          color: "#1677ff",
          borderColor: "#ffffff",
          borderWidth: 2
        },
        label: {
          show: false
        }
      }
    ]
  });

  const cumulativeRecords = filterRecordsByRange(calculatedRecords, activeProfitRange);
  const cumulativeDates = cumulativeRecords.map((item) => item.date);
  const cumulativeData = cumulativeRecords.map((item) => roundNumber(item.cumulativeProfit, 2));
  const cumulativeAxisBounds = getPaddedAxisBounds(cumulativeData);

  cumulativeProfitChart.setOption({
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => `${Number(value).toFixed(2)} 元`
    },
    grid: { left: 56, right: 18, top: 24, bottom: 42 },
    xAxis: {
      type: "category",
      data: cumulativeDates,
      axisTick: { show: false },
      axisLabel: { color: "#858b96" }
    },
    yAxis: {
      type: "value",
      min: cumulativeAxisBounds.min,
      max: cumulativeAxisBounds.max,
      axisLabel: {
        color: "#858b96",
        formatter: (value) => Number(value).toFixed(0)
      },
      splitLine: { lineStyle: { color: "#edf0f3" } }
    },
    series: [
      {
        name: "累计盈亏",
        type: "line",
        data: cumulativeData,
        smooth: false,
        symbol: "emptyCircle",
        symbolSize: 8,
        lineStyle: { width: 3, color: "#e64545" },
        itemStyle: { color: "#e64545" }
      }
    ]
  });

  const detailRecords = filterRecordsByMonth(calculatedRecords, detailMonthFilter);

  profitChart.setOption({
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => `${Number(value).toFixed(2)} 元`
    },
    grid: { left: 56, right: 18, top: 24, bottom: 42 },
    xAxis: {
      type: "category",
      data: detailRecords.map((item) => item.date),
      axisTick: { show: false },
      axisLabel: { color: "#858b96" }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#858b96" },
      splitLine: { lineStyle: { color: "#edf0f3" } }
    },
    series: [
      {
        name: "当日收益",
        type: "bar",
        data: profitDataForChart(detailRecords),
        barMaxWidth: 34
      }
    ]
  });
}

function renderTrendPanel() {
  const isPerformance = activeTrendChart === "performance";

  dom.returnChartEl.classList.toggle("hidden", !isPerformance);
  dom.cumulativeProfitChartEl.classList.toggle("hidden", isPerformance);
  dom.tradeLegend.classList.toggle("hidden", !isPerformance);

  document.querySelectorAll("#trendChartTabs button").forEach((item) => {
    item.classList.toggle("active", item.dataset.chart === activeTrendChart);
  });
  renderRangeTabs();

  window.setTimeout(() => {
    returnChart?.resize();
    cumulativeProfitChart?.resize();
  }, 0);
}

function renderRangeTabs() {
  const currentRange = activeTrendChart === "performance" ? activeRange : activeProfitRange;
  document.querySelectorAll("#rangeTabs button").forEach((item) => {
    item.classList.toggle("active", item.dataset.range === currentRange);
  });
}

function getRangeChangePercent(items, baseNetValue) {
  return items.map((item) => roundNumber((safeDivide(item.netValue, baseNetValue) - 1) * 100, 2));
}

function getTradeMarks(items, type, baseNetValue) {
  return items
    .filter((item) => (type === "buy" ? item.deposit > 0 : item.withdraw > 0))
    .map((item) => ({
      value: [item.date, roundNumber((safeDivide(item.netValue, baseNetValue) - 1) * 100, 2)],
      record: item
    }));
}

function getPaddedAxisBounds(values) {
  if (values.length === 0) {
    return { min: -1, max: 1 };
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const padding = range === 0 ? Math.max(Math.abs(maxValue) * 0.1, 0.5) : range * 0.12;

  return {
    min: roundNumber(minValue - padding, 2),
    max: roundNumber(maxValue + padding, 2)
  };
}

function profitDataForChart(items) {
  return items.map((item) => ({
    value: roundNumber(item.dailyProfit, 2),
    itemStyle: {
      color: item.dailyProfit >= 0 ? "#e64545" : "#16a06b"
    }
  }));
}

function filterRecordsByRange(items, range) {
  if (range === "all" || items.length === 0) return items;

  const latestDate = parseLocalDate(items.at(-1).date);
  let startDate = new Date(latestDate);

  if (range === "week") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === "month") {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (range === "quarter") {
    startDate.setMonth(startDate.getMonth() - 3);
  } else if (range === "year") {
    startDate = new Date(latestDate.getFullYear(), 0, 1);
  }

  return items.filter((item) => parseLocalDate(item.date) >= startDate);
}

function filterRecordsByMonth(items, month) {
  if (!month) return items;
  return items.filter((item) => item.date.startsWith(month));
}

function renderTable() {
  const tableRecords = getFilteredHistoryRecords();
  dom.recordCount.textContent = historyMonthFilter
    ? `${tableRecords.length} / ${calculatedRecords.length} 条`
    : `${calculatedRecords.length} 条`;

  if (tableRecords.length === 0) {
    const emptyText = calculatedRecords.length === 0 ? "暂无记录" : "当前年月暂无记录";
    dom.recordTableBody.innerHTML = `<tr><td colspan="11" class="empty-cell">${emptyText}</td></tr>`;
    return;
  }

  dom.recordTableBody.innerHTML = tableRecords
    .slice()
    .reverse()
    .map((record) => `
      <tr>
        <td>${escapeHTML(record.date)}</td>
        <td class="${getNumberClass(record.dailyRate)}">${formatSignedPercent(record.dailyRate * 100)}</td>
        <td>${formatNetValue(record.netValue)}</td>
        <td>${formatMoney(record.deposit)}</td>
        <td>${formatMoney(record.withdraw)}</td>
        <td class="${getNumberClass(record.dailyProfit)}">${formatSignedMoney(record.dailyProfit)}</td>
        <td>${formatMoney(record.currentAmount)}</td>
        <td class="${getNumberClass(record.cumulativeProfit)}">${formatSignedMoney(record.cumulativeProfit)}</td>
        <td class="${getNumberClass(record.holdingReturn)}">${formatSignedPercent(record.holdingReturn * 100)}</td>
        <td title="${escapeHTML(record.note)}">${escapeHTML(record.note || "-")}</td>
        <td>
          <div class="action-cell">
            <button type="button" onclick="editRecord('${escapeHTML(record.date)}')">编辑</button>
            <button class="delete" type="button" onclick="deleteRecord('${escapeHTML(record.date)}')">删除</button>
          </div>
        </td>
      </tr>
    `)
    .join("");
}

function renderHistoryPanel() {
  dom.historyPanel.classList.toggle("collapsed", historyCollapsed);
  dom.toggleHistoryBtn.textContent = historyCollapsed ? "展开" : "收起";
}

function toggleHistoryPanel() {
  historyCollapsed = !historyCollapsed;
  renderHistoryPanel();
}

function renderDetailPanel() {
  dom.detailPanel.classList.toggle("collapsed", detailCollapsed);
  dom.toggleDetailBtn.textContent = detailCollapsed ? "展开" : "收起";
}

function toggleDetailPanel() {
  detailCollapsed = !detailCollapsed;
  renderDetailPanel();

  if (!detailCollapsed) {
    window.setTimeout(() => profitChart?.resize(), 0);
  }
}

function getFilteredHistoryRecords() {
  if (!historyMonthFilter) return calculatedRecords;
  return calculatedRecords.filter((record) => record.date.startsWith(historyMonthFilter));
}

function addOrUpdateRecord(event) {
  event.preventDefault();

  const date = dom.date.value;
  const dailyRateInput = Number(dom.dailyRate.value);
  const deposit = Number(dom.deposit.value || 0);
  const withdraw = Number(dom.withdraw.value || 0);
  const editingDate = dom.editingDate.value;

  if (!date || Number.isNaN(dailyRateInput)) {
    alert("请填写日期和当日涨跌幅。");
    return;
  }

  if (deposit < 0 || withdraw < 0) {
    alert("追加金额和赎回金额不能为负数。");
    return;
  }

  const nextRecord = {
    date,
    dailyRate: dailyRateInput / 100,
    deposit,
    withdraw,
    note: dom.note.value.trim()
  };

  const nextRecords = records.filter((item) => item.date !== editingDate);
  const sameDateIndex = nextRecords.findIndex((item) => item.date === date);

  if (sameDateIndex >= 0) {
    const confirmed = confirm("该日期已有记录，是否覆盖原记录？");
    if (!confirmed) return;
    nextRecords.splice(sameDateIndex, 1, nextRecord);
  } else {
    nextRecords.push(nextRecord);
  }

  records = nextRecords.sort((a, b) => a.date.localeCompare(b.date));
  saveRecords();
  resetForm();
  renderAll();
}

function editRecord(date) {
  const record = records.find((item) => item.date === date);
  if (!record) return;

  dom.formTitle.textContent = "编辑记录";
  dom.editingDate.value = record.date;
  dom.date.value = record.date;
  dom.dailyRate.value = roundNumber(record.dailyRate * 100, 4);
  dom.deposit.value = record.deposit;
  dom.withdraw.value = record.withdraw;
  dom.note.value = record.note;
  dom.cancelEditBtn.classList.remove("hidden");
  dom.date.focus();
}

function deleteRecord(date) {
  const confirmed = confirm(`确认删除 ${date} 的记录吗？`);
  if (!confirmed) return;

  records = records.filter((item) => item.date !== date);
  saveRecords();

  if (dom.editingDate.value === date) {
    resetForm();
  }

  renderAll();
}

function clearAllRecords() {
  const confirmed = confirm("确认清空全部数据吗？此操作不可恢复。");
  if (!confirmed) return;

  records = [];
  saveRecords();
  resetForm();
  renderAll();
}

function exportCSV() {
  if (calculatedRecords.length === 0) {
    alert("暂无可导出的记录。");
    return;
  }

  const headers = [
    "日期",
    "当日涨跌幅",
    "净值",
    "追加金额",
    "赎回金额",
    "备注",
    "当日收益",
    "当前持仓金额",
    "累计投入金额",
    "累计盈亏",
    "持有成本",
    "持有收益",
    "持有收益率"
  ];

  const rows = calculatedRecords.map((record) => [
    record.date,
    `${roundNumber(record.dailyRate * 100, 4)}%`,
    formatNetValue(record.netValue),
    roundNumber(record.deposit, 2),
    roundNumber(record.withdraw, 2),
    record.note,
    roundNumber(record.dailyProfit, 2),
    roundNumber(record.currentAmount, 2),
    roundNumber(record.totalInvested, 2),
    roundNumber(record.cumulativeProfit, 2),
    roundNumber(record.holdingCost, 2),
    roundNumber(record.holdingProfit, 2),
    `${roundNumber(record.holdingReturn * 100, 4)}%`
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSVCell).join(","))
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fund-records-${getTodayString()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function resetForm() {
  dom.recordForm.reset();
  dom.formTitle.textContent = "新增记录";
  dom.editingDate.value = "";
  dom.date.value = getTodayString();
  dom.deposit.value = "0";
  dom.withdraw.value = "0";
  dom.cancelEditBtn.classList.add("hidden");
}

function setValue(element, text, numberValue) {
  element.textContent = text;
  element.classList.remove("positive", "negative", "neutral");
  element.classList.add(getNumberClass(numberValue));
}

function setNeutralValue(element, text) {
  element.textContent = text;
  element.classList.remove("positive", "negative", "neutral");
  element.classList.add("neutral");
}

function getNumberClass(value) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function formatSignedMoney(value) {
  const number = Number(value || 0);
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(2)}`;
}

function formatSignedPercent(value) {
  const number = Number(value || 0);
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(2)}%`;
}

function formatNetValue(value) {
  return Number(value || 0).toFixed(4);
}

function safeDivide(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function roundNumber(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeCSVCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

// 让表格中的行内按钮可以调用对应操作。
window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
