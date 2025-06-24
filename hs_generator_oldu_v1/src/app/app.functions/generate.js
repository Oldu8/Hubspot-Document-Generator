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
  const { userId = "", doc_name = "", objectId = "" } = parameters;

  const token = process.env["PRIVATE_APP_ACCESS_TOKEN"];

  console.log("🧪 Parameters:", parameters);

  // const objectType = "0-3";
  // const toObjectType = "2-41599976";

  let recordIds = [];

  const body = JSON.stringify({
    inputs: [{ id: objectId }],
  });

  try {
    console.log("!!!!!!! Start request");
    const response = await fetch(
      "https://api.hubapi.com/crm/v3/associations/deal/2-41599976/batch/read",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        body,
      }
    );

    const data = await response.json();
    console.log("Associated records:", data);
    const results = data?.results?.map((result) => result.to[0]?.id) || [];
    console.log("got the ids::", results);
  } catch (e) {
    console.error(e);
  }

  // console.log("🧾 Associated Thalamus Product IDs:", recordIds);

  if (!doc_name) {
    return {
      statusCode: 400,
      body: { error: "Missing document name" },
    };
  }

  const data = {
    institution_name: propertiesToSend.institution_name_sync,
    gme_id: propertiesToSend.acgme_institution_id_sync,
    address: {
      street: propertiesToSend.company_street_address__sync_,
      city: propertiesToSend.company_city__sync_,
      state: propertiesToSend.company_state_sync_,
      zip: propertiesToSend.company_zip__sync_,
    },
    products: [],
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
