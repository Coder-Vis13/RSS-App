export const parseNumericId = (
    value: string,
    field: string = 'id'
) : number => {
    const parsedId = Number(value);
    if (Number.isNaN(parsedId)) {
        throw new Error(`Invalid ${field}: ${value}`);
    }
    return parsedId;

}
