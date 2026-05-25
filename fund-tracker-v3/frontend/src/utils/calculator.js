export function calculateRecords(records) {
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
  let previousAmount = 0;
  let netValue = 1;
  let totalDeposit = 0;
  let totalWithdraw = 0;

  return sortedRecords.map((record) => {
    const dailyRate = Number(record.dailyRate) || 0;
    const deposit = Number(record.deposit) || 0;
    const withdraw = Number(record.withdraw) || 0;
    const dailyProfit = previousAmount * dailyRate;
    const currentAmount = previousAmount * (1 + dailyRate) + deposit - withdraw;

    netValue *= 1 + dailyRate;

    totalDeposit += deposit;
    totalWithdraw += withdraw;

    const totalInvested = totalDeposit - totalWithdraw;
    const cumulativeProfit = currentAmount - totalInvested;
    const cumulativeReturn = totalInvested === 0 ? 0 : cumulativeProfit / totalInvested;

    previousAmount = currentAmount;

    return {
      ...record,
      netValue,
      dailyProfit,
      currentAmount,
      totalInvested,
      cumulativeProfit,
      cumulativeReturn
    };
  });
}

export function calculateSummary(calculatedRecords) {
  const latest = calculatedRecords.at(-1);

  if (!latest) {
    return {
      currentAmount: 0,
      totalInvested: 0,
      cumulativeProfit: 0,
      cumulativeReturn: 0,
      todayProfit: 0,
      latestRate: 0,
      latestDate: ""
    };
  }

  return {
    currentAmount: latest.currentAmount,
    totalInvested: latest.totalInvested,
    cumulativeProfit: latest.cumulativeProfit,
    cumulativeReturn: latest.cumulativeReturn,
    todayProfit: latest.dailyProfit,
    latestRate: latest.dailyRate,
    latestDate: latest.date
  };
}

export function filterRecordsByRange(records, range) {
  if (range === "all" || records.length === 0) return records;

  const latestDate = parseDate(records.at(-1).date);
  let startDate = new Date(latestDate);

  if (range === "week") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === "month") {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (range === "threeMonths") {
    startDate.setMonth(startDate.getMonth() - 3);
  } else if (range === "year") {
    startDate = new Date(latestDate.getFullYear(), 0, 1);
  }

  return records.filter((record) => parseDate(record.date) >= startDate);
}

function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}
