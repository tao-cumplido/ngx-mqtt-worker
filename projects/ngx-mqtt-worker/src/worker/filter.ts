export function validate(filter: string): RegExp | undefined {
    const validator = /^(?:#|\+|(?:[^$+#/]*|\+)(?:\/(?:[^$+#/]*|\+))*(?:\/+|\/#)?)$/;

    if (!validator.test(filter)) {
        return;
    }

    filter = filter.replace('+', '[^/]*').replace('#', '.*');

    return new RegExp(`^${filter}$`);
}
