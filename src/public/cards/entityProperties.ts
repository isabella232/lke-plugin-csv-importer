import {EntitiesTypes} from "../models";
import * as utils from "../utils";
import {ImportResult, ImportState} from "../../@types/shared";

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

  setTitle(entityType: EntitiesTypes, headers: string[]) {
    if (headers.length > 0) {
      this.titleHolder.innerText = `The following will be mapped to ${this.titleCompleter[entityType]} properties`;
    } else {
      this.titleHolder.innerText = `There are no ${this.titleCompleter[entityType]} properties in the file`;
    }
  }

  /**
   * show properties name that will be added to each node (headers name)
   */
  setNameProperties(entityType: EntitiesTypes, headers: string[]) {
    utils.removeChildrenOf(this.entityProperties);
    if (headers.length > 0) {
      const propertyNames =
        entityType === EntitiesTypes.NODES
          ? headers
          : headers.slice(2);
      propertyNames.forEach((header: string) => {
        this.addProperty(header);
      });
    }
  }

  setButtonName(entityType: EntitiesTypes) {
    this.nextButton.innerText =
      entityType === EntitiesTypes.NODES ? "Import" : "Next";
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
  ): Promise<ImportResult> {
    utils.startWaiting();
    try {
      await utils.makeRequest("POST", "api/importNodes", {
        sourceKey: sourceKey,
        itemType: entityName,
        csv: csv
      });
      return this.importListener()
    } catch (error) {
      throw new Error("Import has failed");
    } finally {
      utils.stopWaiting();
    }
  }

  async importListener(): Promise<ImportResult> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const response = await utils.makeRequest("POST", "api/importStatus", {});
        const parsedResponse: ImportState = JSON.parse(response.response);
        if (!parsedResponse.importing) {
          resolve(parsedResponse.lastImport!);
        } else {
          utils.updateProgress(parsedResponse.progress);
          resolve(await this.importListener())
        }
      }, 1000)
    })

  }

  async nextStep(
    csv: string,
    entityName?: string,
    sourceKey?: string
  ): Promise<ImportResult | undefined> {
    this.hideCard();
    if (this.entityType === EntitiesTypes.NODES) {
      return this.importNodes(csv, entityName, sourceKey);
    }
    return;
  }

  hideCard() {
    this.container.style.display = "none";
  }

  showCard(
    entityType?: EntitiesTypes,
    headers?: string[]
  ) {
    if (entityType !== undefined && headers !== undefined) {
      this.entityType = entityType;
      this.setTitle(entityType, headers);
      this.setNameProperties(entityType, headers);
      this.setButtonName(entityType);
    }
    this.container.style.display = "block";
  }
}
