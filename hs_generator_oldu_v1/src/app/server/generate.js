export const main = async (context) => {
  const body = JSON.parse(context.body);

  const { documentType, dealData } = body;

  const fileContent = `Doc type: ${documentType}\n\n
  Data:\n${JSON.stringify(dealData, null, 2)}`;

  const buffer = buffer.from(fileContent, "utf-8");

  return {
    statusCode: 200,
    body: buffer.toString("base64"),
    isBase64Encoded: true,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${documentType}.txt"`,
    },
  };
};
