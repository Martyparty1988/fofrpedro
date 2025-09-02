const gameOverQuotes = [
    "Chytili tě, zmde.",
    "Konec lajny, frajere.",
    "Těsně, vole. Příště víc koksu.",
    "Do hajzlu s tím!",
    "Kurva fix, to bolelo jak pes!",
    "Sežrala mě ta sračka.",
    "Žižkov tě dostal.",
];

export const getRandomQuote = (): string => {
    return gameOverQuotes[Math.floor(Math.random() * gameOverQuotes.length)];
};