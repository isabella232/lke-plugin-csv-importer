import { EntitiesTypes } from "../models";
import * as utils from "../utils";

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

  private largestPropertyLength = 0;

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
   * Using data in session storage, show properties name that will be added to each node (headers name)
   */
  setNameProperties(entityType: EntitiesTypes) {
    utils.removeChildrenOf(this.entityProperties);
    const headers = sessionStorage.getItem("headers");
    if (headers) {
      const headersParsed = headers.split(",");
      const headersFinal =
        entityType === EntitiesTypes.nodes
          ? headersParsed
          : headersParsed.slice(2);
      this.largestPropertyLength = headersFinal.reduce(
        (maxLength: number, header: string) => {
          return header.length > maxLength ? header.length : maxLength;
        },
        0
      );
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
    newProperty.style.width = `${this.largestPropertyLength * 10}px`;
    this.entityProperties.append(newProperty);
  }

  /**
   * Using data in session storage, import it and return message of success
   */
  async importNodes(): Promise<string> {
    utils.startWaiting();
    try {
      const rows = sessionStorage.getItem("rows");
      const headers = sessionStorage.getItem("headers");
      const categoryName = sessionStorage.getItem("entityName");
      if (rows && headers && categoryName) {
        const rowsParsed = JSON.parse(rows);
        const headersParsed = headers.split(",");
        const nodes = rowsParsed.map((row: any) => {
          const rowParsed = row.split(",");
          return {
            categories: [categoryName],
            properties: headersParsed.reduce((allProperties, header, index) => {
              return {
                ...allProperties,
                [header]: rowParsed[index],
              };
            }, {}),
          };
        });
        const resNodes = await utils.makeRequest(
          "POST",
          `api/addNodes?sourceKey=${sessionStorage.getItem("sourceKey")}`,
          {
            nodes: nodes,
          }
        );
        const data = JSON.parse(resNodes.response);
        return `${data.success}/${data.total} nodes have been added to the database`;
      }
      return "";
    } catch (error) {
      throw new Error("Import has failed");
    } finally {
      utils.stopWaiting();
    }
  }

  async nextStep(entityType: EntitiesTypes): Promise<string | undefined> {
    this.hideCard();
    return entityType === EntitiesTypes.nodes ? this.importNodes() : undefined;
  }

  hideCard() {
    this.container.style.display = "none";
  }

  showCard(entityType?: EntitiesTypes) {
    if (entityType !== undefined) {
      this.setTitle(entityType);
      this.setNameProperties(entityType);
      this.setButtonName(entityType);
    }
    this.container.style.display = "block";
  }
}
