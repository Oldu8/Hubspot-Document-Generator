const hubspot = require("@hubspot/api-client");

exports.main = async (context = {}) => {
  try {
    const { propertiesToSend = {}, parameters = {} } = context;

    // Преобразуем данные в текст
    const lines = [
      `Document generated for user ID: ${parameters.userId}`,
      "---",
      ...Object.entries(propertiesToSend).map(
        ([key, value]) => `${key}: ${value ?? "null"}`
      ),
    ];
    const content = lines.join("\n");

    // Преобразуем в Buffer
    const buffer = Buffer.from(content, "utf-8");

    // Название файла
    const filename = `deal_info_${Date.now()}.txt`;

    return {
      statusCode: 200,
      body: {
        success: true,
        message: "TXT document generated",
        filename,
        document: buffer.toString("base64"),
        mimeType: "text/plain",
      },
    };
  } catch (error) {
    console.error("Error generating TXT file:", error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: error.message,
      },
    };
  }
};
