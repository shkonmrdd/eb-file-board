export const log = (message: string): void => {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, -5);
  console.log(`[${timestamp}] ${message}`);
};
