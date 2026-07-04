const prompt = `
Analyze the receipt image and extract the following data. Return ONLY a valid JSON object with no additional text, markdown, or explanation.

The JSON must have exactly these keys at the top level:
{
  "sellerName": "string or null",
  "totalAmount": number or null,
  "date": "YYYY-MM-DD or null",
  "taxAmount": number or null,
  "currency": "ISO 4217 code (e.g. USD, BRL, EUR) or null",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number
    }
  ]
}

Rules:
- Return the JSON flat — do NOT wrap it inside any outer key like "extractedData".
- If a field cannot be extracted, use null.
- items must be an array. If no items are found, return an empty array [].
- Do not include any other keys or explanations outside the JSON.
`

module.exports = prompt;
