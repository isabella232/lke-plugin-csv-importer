import { EntityType } from "../models";

/**
 * Class that handles all the logic for the entity picker card
 * This is the card where the user picks if he wants to import edges or nodes
 */
export class CSVEntityPicker {
  private container!: HTMLElement;
  private options!: NodeListOf<HTMLInputElement>;
  private nextButton!: HTMLButtonElement;

  public entityType: EntityType | null = null;

  init() {
    this.container = document.getElementById(
      "pickEntityContainer"
    ) as HTMLElement;
    this.options = document.getElementsByName(
      "entities"
    ) as NodeListOf<HTMLInputElement>;
    this.options[EntityType.NODE].addEventListener("change", () =>
      this.updateRadioButton(EntityType.NODE)
    );
    this.options[EntityType.EDGE].addEventListener("change", () =>
      this.updateRadioButton(EntityType.EDGE)
    );
    this.nextButton = document.getElementById(
      "nextButtonEntity"
    ) as HTMLButtonElement;
    this.cleanState();
    this.hideCard();
  }

  cleanState() {
    this.entityType = null;
    this.options[EntityType.NODE].checked = false;
    this.options[EntityType.EDGE].checked = false;
    this.nextButton.disabled = true;
  }

  updateRadioButton(value: EntityType) {
    this.options[EntityType.NODE].checked = value === EntityType.NODE;
    this.options[EntityType.EDGE].checked = value === EntityType.EDGE;
    this.entityType = value;
    this.nextButton.disabled = false;
  }

  hideCard() {
    this.container.style.display = "none";
  }

  showCard() {
    this.container.style.display = "block";
  }
}
