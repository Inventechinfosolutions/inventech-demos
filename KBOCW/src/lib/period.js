export function financialYearBounds(financialYear) {
    const start = Number(financialYear.slice(0, 4));
    return {
        from: `${start}-04-01`,
        to: `${start + 1}-03-31`,
    };
}
