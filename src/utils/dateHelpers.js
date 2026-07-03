export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getMonthRange = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
};

export const getWeekRange = (dateStr) => {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: formatDate(monday),
    end: formatDate(sunday),
  };
};

export const getDatesInRange = (startStr, endStr) => {
  const dates = [];
  const current = new Date(startStr + 'T12:00:00');
  const end = new Date(endStr + 'T12:00:00');

  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export const calculateStreaks = (completedDates) => {
  if (!completedDates.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sorted = [...new Set(completedDates)].sort();
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00');
    const curr = new Date(sorted[i] + 'T12:00:00');
    const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      tempStreak += 1;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  const dateSet = new Set(sorted);

  let currentStreak = 0;
  if (dateSet.has(today) || dateSet.has(yesterday)) {
    let checkDate = dateSet.has(today) ? today : yesterday;
    currentStreak = 1;

    while (true) {
      const prev = new Date(checkDate + 'T12:00:00');
      prev.setDate(prev.getDate() - 1);
      const prevStr = formatDate(prev);
      if (dateSet.has(prevStr)) {
        currentStreak += 1;
        checkDate = prevStr;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
};


