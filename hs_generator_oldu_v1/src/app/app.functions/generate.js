const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

exports.main = async (context = {}) => {
  try {
    const { parameters = {}, propertiesToSend = {} } = context;

    const { doc_name = "" } = parameters;
    const templatePath = path.join(
      __dirname,
      "../templates",
      `${doc_name}.docx`
    );

    const content = fs.readFileSync(templatePath, "binary");
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
      },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: { error: err.message },
    };
  }
};
