const raceDrivers2026 = [
    "Pierre Gasly",
    "Franco Colapinto",
    "Fernando Alonso",
    "Lance Stroll",
    "Alexander Albon",
    "Carlos Sainz Jr.",
    "Gabriel Bortoleto",
    "Nico Hülkenberg",
    "Sergio Pérez",
    "Valtteri Bottas",
    "Charles Leclerc",
    "Lewis Hamilton",
    "Esteban Ocon",
    "Oliver Bearman",
    "Lando Norris",
    "Oscar Piastri",
    "George Russell",
    "Kimi Antonelli",
    "Liam Lawson",
    "Arvid Lindblad",
    "Max Verstappen",
    "Isack Hadjar",
];

const potentialStandIns2026 = [
    "Leonardo Fornaroli",
    "Pato O'Ward",
    "Frederik Vesti",
    "Yuki Tsunoda",
    "Antonio Giovinazzi",
    "Luke Browning",
    "Jak Crawford",
    "Jack Doohan",
    "Ryo Hirakawa",
    "Paul Aron",
    "Zhou Guanyu",
];

export const validDriverNames: ReadonlySet<string> = new Set([
    ...raceDrivers2026,
    ...potentialStandIns2026,
]);
