import {EntitiesTypes} from "../models";
import * as utils from "../utils";
import {ImportItemsResponse} from "../../@types/shared";

/**
 * Class that handles all the logic for the entity properties card
 * This is the card where the user sees/confirms all properties name
 * that will be imported to the nodes/edges
 */
export class CSVEntityProperties {
  private container!: HTMLElement;
  private entityProperties!: HTMLElement;
  private titleHolder!: HTMLElement;
  private nextButton!: HTMLButtonElement;
  private entityType!: EntitiesTypes;

  private titleCompleter = ["node", "edge"];

  init() {
    this.container = document.getElementById(
      "entityPropsContainer"
    ) as HTMLElement;
    this.titleHolder = this.container.getElementsByClassName(
      "titleCard"
    )[0] as HTMLElement;
    this.entityProperties = document.getElementById("nameProps") as HTMLElement;
    this.nextButton = document.getElementById(
      "nextButtonProps"
    ) as HTMLButtonElement;
    this.hideCard();
  }

  setTitle(entityType: EntitiesTypes) {
    this.titleHolder.innerText = `The following will be mapped to ${this.titleCompleter[entityType]} properties`;
  }

  /**
   * show properties name that will be added to each node (headers name)
   */
  setNameProperties(entityType: EntitiesTypes, propertiesName?: string) {
    utils.removeChildrenOf(this.entityProperties);
    if (propertiesName) {
      const headersParsed = propertiesName.split(",");
      const headersFinal =
        entityType === EntitiesTypes.nodes
          ? headersParsed
          : headersParsed.slice(2);
      headersFinal.forEach((header: string) => {
        this.addProperty(header);
      });
    }
  }

  setButtonName(entityType: EntitiesTypes) {
    this.nextButton.innerText =
      entityType === EntitiesTypes.nodes ? "Import" : "Next";
  }

  /**
   * Add 1 property name to property names container
   */
  addProperty(name: string) {
    const newProperty = document.createElement("div");
    newProperty.innerText = name;
    newProperty.className = "nodeProperty";
    this.entityProperties.append(newProperty);
  }

  /**
   * import it and return message of success
   */
  async importNodes(
    csv: string,
    entityName?: string,
    sourceKey?: string
  ): Promise<ImportItemsResponse> {
    utils.startWaiting();
    try {
      const resNodes = await utils.makeRequest("POST", "api/importNodes", {
        sourceKey: sourceKey,
        itemType: entityName,
        csv: csv
      });

      return JSON.parse(resNodes.response);
    } catch (error) {
      throw new Error("Import has failed");
    } finally {
      utils.stopWaiting();
    }
  }

  nextStep(
    csv: string,
    entityName?: string,
    sourceKey?: string
  ): Promise<ImportItemsResponse> | void {
    this.hideCard();
    if (this.entityType === EntitiesTypes.nodes) {
      return this.importNodes(csv, entityName, sourceKey);
    }
  }

  hideCard() {
    this.container.style.display = "none";
  }

  showCard(
    entityType?: EntitiesTypes,
    propertiesName?: string,
  ) {
    if (entityType !== undefined) {
      this.entityType = entityType;
      this.setTitle(entityType);
      this.setNameProperties(entityType, propertiesName);
      this.setButtonName(entityType);
    }
    this.container.style.display = "block";
  }
}
