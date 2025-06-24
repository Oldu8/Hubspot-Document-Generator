async function postJsonRequest(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const body = await response.text();

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      throw {
        statusCode: 500,
        message: "Invalid JSON response",
      };
    }

    if (!response.ok) {
      throw {
        statusCode: response.status,
        message: parsed?.error || "Request failed",
      };
    }

    return parsed;
  } catch (err) {
    throw {
      statusCode: err.statusCode || 500,
      message: err.message || "Unexpected error",
    };
  }
}

exports.main = async (context = {}) => {
  const { parameters = {}, propertiesToSend = {} } = context;
  const { userId = "", doc_name = "", objectId = "" } = parameters;

  const token = process.env["PRIVATE_APP_ACCESS_TOKEN"];
  const externalBackendUrl =
    "https://hs-docx-backend-oleg-1814-oleh-dudkos-projects.vercel.app/api/generate";

  // const objectType = "0-3";
  // const toObjectType = "2-41599976";

  const body = JSON.stringify({
    inputs: [{ id: objectId }],
  });

  try {
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
    const recordIdArr = data?.results?.map((result) => result.to[0]?.id) || [];

    const propertiesList =
      "?properties=product_name,cost,associated_program_id__sync_,specialty,thalamus_core_id__sync_,eras_program__sync_";

    const productsRequests = recordIdArr.map((recordId) => {
      return fetch(
        `https://api.hubapi.com/crm/v3/objects/2-41599976/${recordId}${propertiesList}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      ).then((response) => response.json());
    });

    const productsResponses = await Promise.all(productsRequests);

    const dataToSend = {
      institution_name: propertiesToSend.institution_name_sync,
      gme_id: propertiesToSend.acgme_institution_id_sync,
      address: {
        street: propertiesToSend.company_street_address__sync_,
        city: propertiesToSend.company_city__sync_,
        state: propertiesToSend.company_state_sync_,
        zip: propertiesToSend.company_zip__sync_,
      },
      products: productsResponses,
    };

    console.log("sending data to custom backend::", dataToSend);

    const result = await postJsonRequest(externalBackendUrl, {
      doc_name,
      data: dataToSend,
    });

    console.log("get document back from external backend::", result);

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
  } catch (e) {
    console.error(e);
  }
};
