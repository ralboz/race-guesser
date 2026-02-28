export type DriverStatic = { driverNumber: number | null; driverName: string };

const raceDrivers2026: DriverStatic[] = [
    { driverNumber: 10, driverName: "Pierre Gasly" },
    { driverNumber: 43, driverName: "Franco Colapinto" },
    { driverNumber: 14, driverName: "Fernando Alonso" },
    { driverNumber: 18, driverName: "Lance Stroll" },
    { driverNumber: 23, driverName: "Alexander Albon" },
    { driverNumber: 55, driverName: "Carlos Sainz" },
    { driverNumber: 5, driverName: "Gabriel Bortoleto" },
    { driverNumber: 27, driverName: "Nico Hülkenberg" },
    { driverNumber: 11, driverName: "Sergio Pérez" },
    { driverNumber: 77, driverName: "Valtteri Bottas" },
    { driverNumber: 16, driverName: "Charles Leclerc" },
    { driverNumber: 44, driverName: "Lewis Hamilton" },
    { driverNumber: 31, driverName: "Esteban Ocon" },
    { driverNumber: 87, driverName: "Oliver Bearman" },
    { driverNumber: 1, driverName: "Lando Norris" },
    { driverNumber: 81, driverName: "Oscar Piastri" },
    { driverNumber: 63, driverName: "George Russell" },
    { driverNumber: 12, driverName: "Andrea Kimi Antonelli" },
    { driverNumber: 30, driverName: "Liam Lawson" },
    { driverNumber: 41, driverName: "Arvid Lindblad" },
    { driverNumber: 3, driverName: "Max Verstappen" },
    { driverNumber: 6, driverName: "Isack Hadjar" },
    { driverNumber: 24, driverName: "Zhou Guanyu" }
];

const potentialStandIns2026: DriverStatic[] = [
    { driverNumber: null, driverName: "Leonardo Fornaroli" },
    { driverNumber: null, driverName: "Pato O'Ward" },
    { driverNumber: null, driverName: "Frederik Vesti" },
    { driverNumber: null, driverName: "Yuki Tsunoda" },
    { driverNumber: null, driverName: "Antonio Giovinazzi" },
    { driverNumber: null, driverName: "Luke Browning" },
    { driverNumber: null, driverName: "Jak Crawford" },
    { driverNumber: null, driverName: "Jack Doohan" },
    { driverNumber: null, driverName: "Ryo Hirakawa" },
    { driverNumber: null, driverName: "Paul Aron" },
    { driverNumber: null, driverName: "Zhou Guanyu" },
];

export const driverNumToNameMap: Record<number, string> = raceDrivers2026.reduce(
    (acc, d) => {
        if (typeof d.driverNumber === "number") acc[d.driverNumber] = d.driverName;
        return acc;
    },
    {} as Record<number, string>
);

export const validDriverNames: ReadonlySet<string> = new Set([
    ...raceDrivers2026.map(d => d.driverName),
    ...potentialStandIns2026.map(d => d.driverName),
]);
