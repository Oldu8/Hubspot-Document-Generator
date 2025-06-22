import React, { useState } from "react";
import {
  Button,
  Text,
  Stack,
  LoadingSpinner,
  hubspot,
  Box,
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
  "institution_name_sync",
  "acgme_institution_id_sync",
  "associated_program_id__sync_",
  "specialty",
  "thalamus_core_id__sync_",
  "product_name",
  "cost",
  "eras_program__sync_",
  "company_street_address__sync_",
  "company_zip__sync_",
  "company_state_sync_",
  "company_city__sync_",
];

// Main component
const Card = ({ context, sendAlert, fetchProperties, openIframeModal }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dealObj, setDealObj] = useState({});

  const generateDocument = async () => {
    setIsGenerating(true);

    try {
      const properties = await fetchProperties(fetch_data_arr);
      // get the all fields we need to fetch from Craig document
      setDealObj(properties);
      // Call the serverless function to generate the document
      // here will be request to server
      // for now skip it
      // to test return the empty document
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

      {dealObj?.dealname ? (
        <Box>
          <Text format={{ fontWeight: "bold" }}>Selected deal:</Text>
          <List variant="unordered-styled">
            {Object.entries(dealObj).map(([key, value]) => (
              <List.Item key={key}>
                <Text>{`${key}: ${value}`}</Text>
              </List.Item>
            ))}
          </List>
        </Box>
      ) : null}

      {isGenerating ? (
        <Stack direction="row" gap="small" align="center">
          <LoadingSpinner />
          <Text>Generating document...</Text>
        </Stack>
      ) : (
        <Button
          variant="primary"
          onClick={generateDocument}
          disabled={isGenerating}
        >
          Generate Word Document
        </Button>
      )}

      <Text variant="microcopy" format={{ italic: true }}>
        The document will include the deal name and basic information.
      </Text>
    </Stack>
  );
};
