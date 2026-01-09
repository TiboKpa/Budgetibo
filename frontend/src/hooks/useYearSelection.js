import { useState } from 'react';

export const useYearSelection = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const previousYear = () => setSelectedYear(y => y - 1);
  const nextYear = () => setSelectedYear(y => y + 1);

  return {
    selectedYear,
    setSelectedYear,
    previousYear,
    nextYear
  };
};
