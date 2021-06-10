import {EntitiesTypes} from "../models";

/**
 * Class that handles all logic of the entity name card
 * This is the card where the user sees/confirms the:
 *  - category if a node import
 *  - type if an egge import
 *  predefined in the file name
 */
export class CSVEntityName {
  private container!: HTMLElement;
  private entityName!: HTMLElement;
  private titleHolder!: HTMLElement;

  private titleCompleter = ["node category", "edge type"];

  init() {
    this.container = document.getElementById(
      "entityNameContainer"
    ) as HTMLElement;
    this.titleHolder = this.container.getElementsByClassName(
      "titleCard"
    )[0] as HTMLElement;
    this.entityName = document.getElementById("nameCat") as HTMLElement;
    this.hideCard();
  }

  setTitle(entityType: EntitiesTypes) {
    this.titleHolder.innerText = `Is this the ${this.titleCompleter[entityType]}?`;
  }

  /**
   * show node category name to user
   */
  setNameCategory(entityName?: string) {
    if (entityName) {
      this.entityName.innerText = entityName;
    }
  }

  hideCard() {
    this.container.style.display = "none";
  }

  showCard(entityType?: EntitiesTypes, entityName?: string) {
    if (entityType !== undefined) {
      this.setTitle(entityType);
    }
    this.setNameCategory(entityName);
    this.container.style.display = "block";
  }
}
