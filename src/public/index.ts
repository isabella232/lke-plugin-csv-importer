import {
  CSVUploader,
  CSVEntityPicker,
  CSVEntityName,
  CSVEntityProperties,
  CSVEdgeMapping,
  CSVImportFeedback,
} from "./cards";
import {EntitiesTypes} from "./models";
import * as utils from "./utils";
import {CSVFileStructureExample} from "./cards/fileStructureExample";
import {EntityType} from "@linkurious/rest-client";

function main() {

  let sourceKey: string | undefined;
  let propertiesName: string | undefined;
  let entityName: string;
  let csv = "";

  /************** Initialize plugin  ************/

  const uploader = new CSVUploader();
  uploader.init();

  const csvFileStructureExample = new CSVFileStructureExample();
  csvFileStructureExample.init();

  const entityPicker = new CSVEntityPicker();
  entityPicker.init();

  const entityNameCard = new CSVEntityName();
  entityNameCard.init();

  const entityProperties = new CSVEntityProperties();
  entityProperties.init();

  const edgeMapping = new CSVEdgeMapping();
  edgeMapping.init();

  const importFeedback = new CSVImportFeedback();
  importFeedback.init();

  /************** Set event handlers ************/

    // cancel button (go to first page and reset state)
    // WARNING: all button with this class will trigger a reset if clicked
  const resetPluginActions = document.getElementsByClassName(
    "resetPluginAction"
    ) as HTMLCollectionOf<HTMLElement>;
  for (let i = 0; i < resetPluginActions.length; i++) {
    resetPluginActions[i].addEventListener("click", () => {
      resetPlugin();
    });
  }

  // first screen event handler
  const fileInput = document.getElementById("importFile") as HTMLInputElement;
  const readButton = document.getElementById("readButton") as HTMLElement;
  const showExampleButton = document.getElementById("showExampleButton") as HTMLElement;
  fileInput.addEventListener("change", uploader.showFile.bind(uploader));
  readButton.addEventListener("click", async () => {
    ({sourceKey, csv, propertiesName, entityName} = await uploader.readFile());
    entityPicker.showCard();
  });
  showExampleButton.addEventListener("click", () => {
    uploader.hideCard();
    csvFileStructureExample.showCard();
  });

  // CSV example screen event handler
  const showNodeExampleButton = document.getElementById("showNodeExampleButton") as HTMLElement;
  const showEdgeExampleButton = document.getElementById("showEdgeExampleButton") as HTMLElement;
  const exitExampleButton = document.getElementById("exitExampleButton") as HTMLElement;
  showNodeExampleButton.addEventListener("click", () => {
    csvFileStructureExample.showImageExample(EntityType.NODE);
  });
  showEdgeExampleButton.addEventListener("click", () => {
    csvFileStructureExample.showImageExample(EntityType.EDGE);
  });
  exitExampleButton.addEventListener("click", () => {
    csvFileStructureExample.hideCard();
    uploader.showCard(true);
  });

  // entity picker event handler
  const previousButtonEntities = document.getElementById(
    "previousButtonEntity"
  ) as HTMLInputElement;
  const nextButton = document.getElementById(
    "nextButtonEntity"
  ) as HTMLButtonElement;
  previousButtonEntities.addEventListener("click", () => {
    entityPicker.hideCard();
    uploader.showCard(true);
  });
  nextButton.addEventListener("click", () => {
    entityPicker.hideCard();
    entityNameCard.showCard(entityPicker.entityType!, entityName);
  });

  // entity type/category  event handler
  const previousButtonCat = document.getElementById(
    "previousButtonCat"
  ) as HTMLInputElement;
  const nextButtonCat = document.getElementById("nextButtonCat") as HTMLElement;
  previousButtonCat.addEventListener("click", () => {
    entityNameCard.hideCard();
    entityPicker.showCard();
  });
  nextButtonCat.addEventListener("click", () => {
    entityNameCard.hideCard();
    entityProperties.showCard(entityPicker.entityType!, propertiesName);
  });

  // entity properties event handler
  const previousButtonProps = document.getElementById(
    "previousButtonProps"
  ) as HTMLInputElement;
  const nextButtonProps = document.getElementById(
    "nextButtonProps"
  ) as HTMLElement;
  previousButtonProps.addEventListener("click", () => {
    entityProperties.hideCard();
    entityNameCard.showCard(undefined, entityName);
  });
  nextButtonProps.addEventListener("click", async () => {
    const feedback = await entityProperties.nextStep(
      entityPicker.entityType!,
      csv,
      entityName,
      sourceKey
    );
    entityPicker.entityType === EntitiesTypes.nodes
      ? importFeedback.showCard(feedback as string)
      : edgeMapping.showCard();
  });

  // edge mapping event handler
  const previousButtonEdge = document.getElementById(
    "previousButtonEdge"
  ) as HTMLInputElement;
  const importButtonEdge = document.getElementById(
    "importButtonEdge"
  ) as HTMLElement;
  previousButtonEdge.addEventListener("click", () => {
    edgeMapping.hideCard();
    entityProperties.showCard();
  });
  importButtonEdge.addEventListener("click", async () => {
    importFeedback.showCard(await edgeMapping.importAndFeedback(
      csv,
      entityName,
      sourceKey
    ));
  });

  // import feedback event handler
  const goBackLinkurious = document.getElementById(
    "goBackLinkurious"
  ) as HTMLElement;
  const newFileButton = document.getElementById("newFileButton") as HTMLElement;
  goBackLinkurious.addEventListener("click", async () => {
    utils.goToLinkurious();
  });
  newFileButton.addEventListener("click", async () => {
    importFeedback.hideCard();
    resetPlugin();
  });

  /**
   * Reset all cards to their initial state
   */
  function resetPlugin() {
    uploader.init();
    entityPicker.init();
    entityNameCard.init();
    entityProperties.init();
    edgeMapping.init();
    importFeedback.init();
  }
}

main();
