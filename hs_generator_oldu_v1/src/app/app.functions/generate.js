const https = require("https");

function postJsonRequest(url, data) {
  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify(data);

    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(jsonData),
        },
      },
      (res) => {
        let responseData = [];

        res.on("data", (chunk) => responseData.push(chunk));
        res.on("end", () => {
          const buffer = Buffer.concat(responseData);
          const body = buffer.toString();

          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 400) {
              return reject({
                statusCode: res.statusCode,
                message: parsed.error || "Request failed",
              });
            }
            resolve(parsed);
          } catch (err) {
            reject({ statusCode: 500, message: "Invalid JSON response" });
          }
        });
      }
    );

    req.on("error", (err) => reject({ statusCode: 500, message: err.message }));
    req.write(jsonData);
    req.end();
  });
}

exports.main = async (context = {}) => {
  const { parameters = {}, propertiesToSend = {} } = context;
  const { doc_name = "" } = parameters;

  if (!doc_name) {
    return {
      statusCode: 400,
      body: { error: "Missing document name" },
    };
  }

  const data = {
    institution_name: propertiesToSend.institution_name_sync,
    gme_id: propertiesToSend.acgme_institution_id_sync,
  };

  const backendUrl =
    "https://hs-docx-backend-oleg-1814-oleh-dudkos-projects.vercel.app/api/generate";

  try {
    const result = await postJsonRequest(backendUrl, {
      doc_name,
      data,
    });

    return {
      statusCode: 200,
      body: {
        success: true,
        message: "DOCX document generated",
        filename: result.filename || `institution_quote_${Date.now()}.docx`,
        document: result.document,
        mimeType:
          result.mimeType ||
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    };
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      body: {
        success: false,
        error: err.message || "Unknown error",
      },
    };
  }
};
