export const formatPace = (secondsPerMile: number): string => {
    if (!secondsPerMile || secondsPerMile === Infinity) return "0:00";
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.round(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const calculatePace = (distanceMiles: number, durationSeconds: number): number => {
    if (distanceMiles <= 0) return 0;
    return durationSeconds / distanceMiles; // seconds per mile
};
