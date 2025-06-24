import React, { useState } from "react";
import {
  Button,
  Text,
  Stack,
  LoadingSpinner,
  hubspot,
  Flex,
} from "@hubspot/ui-extensions";

hubspot.extend(({ context, actions }) => (
  <Card
    context={context}
    sendAlert={actions.addAlert}
    fetchProperties={actions.fetchCrmObjectProperties}
    openIframeModal={actions.openIframeModal}
  />
));

const fetch_data_arr = [
  "dealname",
  "record_id",
  "recordId",
  "institution_name_sync",
  "acgme_institution_id_sync",
  "company_street_address__sync_",
  "company_zip__sync_",
  "company_state_sync_",
  "company_city__sync_",
];

const Card = ({ context, sendAlert, fetchProperties, openIframeModal }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDocument = async (doc_name) => {
    setIsGenerating(true);

    try {
      const properties = await fetchProperties(fetch_data_arr);

      const response = await hubspot.serverless("generate", {
        propertiesToSend: fetch_data_arr,
        parameters: {
          userId: context.user.id,
          doc_name: doc_name,
          objectId: context?.crm?.objectId,
        },
      });

      const { document, mimeType, filename } = response.body;

      sendAlert({
        variant: "danger",
        message: `
        context : ${JSON.stringify(mimeType)}
        Available data:
        : ${JSON.stringify(filename)}`,
      });

      const html = `
                    <html>
                      <body style="padding: 2rem; font-family: sans-serif;">
                        <h2>Document ready ${filename}</h2>
                        <p>You can download the file below:</p>
                        <a href="data:${mimeType};base64,${document}" download="${filename}">
                          Click here to download
                        </a>
                      </body>
                    </html>
                  `;

      const base64Html = btoa(unescape(encodeURIComponent(html)));
      const htmlBlobUrl = `data:text/html;base64,${base64Html}`;

      openIframeModal({
        uri: htmlBlobUrl,
        width: 800,
        height: 600,
        title: `Document: ${filename}`,
        flush: false,
      });
    } catch (error) {
      console.error("Error generating document:", error);
      sendAlert({
        variant: "danger",
        message: `Failed to generate document: ${error.message}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Stack direction="column" gap="medium">
      <Text variant="microcopy">
        Select what kind of document you want to generate with data from this
        deal.
      </Text>

      {isGenerating ? (
        <Stack direction="row" gap="small" align="center">
          <LoadingSpinner />
          <Text>Generating document...</Text>
        </Stack>
      ) : (
        <Flex direction={"column"} gap={"small"}>
          <Button
            variant="primary"
            onClick={() => generateDocument("SOW_v250609")}
            disabled={isGenerating}
          >
            SJ MedConnect CSA
          </Button>
          <Button
            variant="primary"
            onClick={() => generateDocument("MSA_v250321")}
            disabled={isGenerating}
          >
            SJ MedConnect MSA
          </Button>
          <Button
            variant="primary"
            onClick={() => generateDocument("SOW_v250321")}
            disabled={isGenerating}
          >
            SJ MedConnect SOW
          </Button>
          <Button
            variant="primary"
            onClick={() => generateDocument("Institutional_v250507")}
            disabled={isGenerating}
          >
            Thalamus Institutional Quote
          </Button>
          <Button
            variant="primary"
            onClick={() => generateDocument("Departmental_v250507")}
            disabled={isGenerating}
          >
            Thalamus Departmental Quote
          </Button>
        </Flex>
      )}

      <Text variant="microcopy" format={{ italic: true }}>
        The document will include the deal name and basic information.
      </Text>
    </Stack>
  );
};
