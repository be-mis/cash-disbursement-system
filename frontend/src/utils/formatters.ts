
export const formatPeso = (value: number | string | undefined | null): string => {
  const numberValue = typeof value === 'string' ? parseFloat(value) : value;
  if (numberValue === null || typeof numberValue === 'undefined' || isNaN(numberValue)) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(0);
  }
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(numberValue);
};

export const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};


export const getNextWorkDay = (date: Date, daysToAdd: number): Date => {
    const newDate = new Date(date);
    let addedDays = 0;
    while (addedDays < daysToAdd) {
        newDate.setDate(newDate.getDate() + 1);
        const dayOfWeek = newDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0=Sun, 6=Sat
            addedDays++;
        }
    }
    return newDate;
};

export const toYyyyMmDd = (date: Date): string => {
    return date.toISOString().split('T')[0];
};
