export const getDollarRate = async (): Promise<number> => {
  try {
    const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    const data = await response.json();
    return parseFloat(data.USDBRL.bid);
  } catch (error) {
    console.error('Error fetching dollar rate:', error);
    return 5.0; // Fallback value
  }
};