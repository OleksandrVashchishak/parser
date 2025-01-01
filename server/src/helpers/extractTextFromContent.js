function extractTextFromContent(input) {
    const results = [];

    // Функція для декодування quoted-printable
    function decodeQuotedPrintable(encoded) {
        return encoded
            .replace(/=\r?\n/g, '') // Видаляємо перенос, що використовується в quoted-printable
            .replace(/=([a-fA-F0-9]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16))); // Декодуємо символи
    }

    // Функція для декодування base64
    function decodeBase64(encoded) {
        return Buffer.from(encoded, 'base64').toString('utf-8');
    }

    // Функція для видалення HTML-тегів
    function stripHtmlTags(input) {
        return input.replace(/<[^>]*>/g, '').trim();
    }

    // Функція для обробки простого тексту
    function extractPlainText(part, encoding) {
        let decodedText = part;
        if (encoding === 'quoted-printable') {
            decodedText = decodeQuotedPrintable(part);
        } else if (encoding === 'base64') {
            decodedText = decodeBase64(part);
        }
        return decodedText.trim();
    }

    // Шукаємо секції text/plain (без кодування)
    const plainTextParts = input.match(/Content-Type: text\/plain; charset="UTF-8"\r\n\r\n([\s\S]*?)\r\n--/g);
    if (plainTextParts) {
        plainTextParts.forEach((part) => {
            const contentMatch = part.match(/\r\n\r\n([\s\S]*?)\r\n--/);
            if (contentMatch) {
                const plainText = contentMatch[1];
                results.push(plainText.trim());
            }
        });
    }

    // Шукаємо секції text/html (без кодування)
    const htmlTextParts = input.match(/Content-Type: text\/html; charset="UTF-8"\r\n\r\n([\s\S]*?)\r\n--/g);
    if (htmlTextParts) {
        htmlTextParts.forEach((part) => {
            const contentMatch = part.match(/\r\n\r\n([\s\S]*?)\r\n--/);
            if (contentMatch) {
                const htmlText = contentMatch[1];
                const cleanText = stripHtmlTags(htmlText);
                results.push(cleanText);
            }
        });
    }

    // Обробка секцій з кодуванням
    const encodedParts = input.match(/Content-Type: (text\/plain|text\/html); charset="UTF-8"\r\nContent-Transfer-Encoding: (quoted-printable|base64)\r\n\r\n([\s\S]*?)\r\n--/g);
    if (encodedParts) {
        encodedParts.forEach((part) => {
            const encodingMatch = part.match(/Content-Transfer-Encoding: (quoted-printable|base64)/);
            const contentMatch = part.match(/\r\n\r\n([\s\S]*?)\r\n--/);

            if (encodingMatch && contentMatch) {
                const encoding = encodingMatch[1];
                const encodedText = contentMatch[1];

                const decodedText = extractPlainText(encodedText, encoding);
                if (part.includes('text/html')) {
                    const cleanText = stripHtmlTags(decodedText);
                    results.push(cleanText);
                } else {
                    results.push(decodedText);
                }
            }
        });
    }

    return results;
}

module.exports = { extractTextFromContent };
