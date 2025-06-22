const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const https = require("https");
const fs = require("fs");
const path = require("path");

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", (err) => reject(err));
      })
      .on("error", (err) => reject(err));
  });
}

exports.main = async (context = {}) => {
  const NAME_LINK_MAP = {
    Institutional_v250507:
      "https://drive.google.com/uc?export=download&id=19_EI9KvOuk0_jWsL2auJsxtoxU492kKWB22_rgSfH6Y",
  };

  try {
    const { parameters = {}, propertiesToSend = {} } = context;

    const { doc_name = "" } = parameters;

    // const fileUrl = NAME_LINK_MAP[doc_name];

    // if (!fileUrl) {
    //   return {
    //     statusCode: 400,
    //     body: { error: "Unknown template name" },
    //   };
    // }

    // let content;
    // try {
    //   content = await downloadFile(fileUrl);
    // } catch (err) {
    //   return {
    //     statusCode: 500,
    //     body: { error: "Failed to download template", details: err.message },
    //   };
    // }
    // const pathToTemplate = path.resolve(
    //   process.env.HUBSPOT_APP_FUNCTIONS_PATH || __dirname,
    //   "templates",
    //   "Institutional_v250507.docx"
    // );
    const pathToTemplate = path.resolve(
      __dirname,
      "templates",
      "Institutional_v250507.docx"
    );
    const content = fs.readFileSync(pathToTemplate);

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // const data = {
    //   institution_name: propertiesToSend.institution_name_sync,
    //   gme_id: propertiesToSend.acgme_institution_id_sync,
    // };

    // doc.setData(data);

    try {
      doc.render();
    } catch (err) {
      return {
        statusCode: 500,
        body: { error: "Template rendering failed", details: err },
      };
    }

    const buf = doc.getZip().generate({ type: "nodebuffer" });
    const base64Doc = buf.toString("base64");

    return {
      statusCode: 200,
      body: {
        success: true,
        filename: `${doc_name}_${Date.now()}.docx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        document: base64Doc,
        templatePath,
      },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: { error: err.message },
    };
  }
};
