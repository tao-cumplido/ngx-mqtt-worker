export function validate(filter: string): RegExp | undefined {
    const validator = /^(?:#|\+|(?:\$?[^$+#/]*|\+)(?:\/(?:[^$+#/]*|\+))*(?:\/+|\/#)?)$/;

    if (!filter || !validator.test(filter)) {
        return;
    }

    filter = filter
        .replace('$', '\\$')
        .replace('+', '[^/]*')
        .replace('#', '.*');

    return new RegExp(`^${filter}$`);
}
