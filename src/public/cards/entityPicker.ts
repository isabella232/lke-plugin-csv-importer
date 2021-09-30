import { EntitiesTypes } from "../models";

/**
 * Class that handles all the logic for the entity picker card
 * This is the card where the user picks if he wants to import edges or nodes
 */
export class CSVEntityPicker {
  private container!: HTMLElement;
  private options!: NodeListOf<HTMLInputElement>;
  private nextButton!: HTMLButtonElement;

  public entityType: EntitiesTypes | null = null;

  init() {
    this.container = document.getElementById(
      "pickEntityContainer"
    ) as HTMLElement;
    this.options = document.getElementsByName(
      "entities"
    ) as NodeListOf<HTMLInputElement>;
    this.options[EntitiesTypes.NODES].addEventListener("change", () =>
      this.updateRadioButton(EntitiesTypes.NODES)
    );
    this.options[EntitiesTypes.EDGES].addEventListener("change", () =>
      this.updateRadioButton(EntitiesTypes.EDGES)
    );
    this.nextButton = document.getElementById(
      "nextButtonEntity"
    ) as HTMLButtonElement;
    this.cleanState();
    this.hideCard();
  }

  cleanState() {
    this.entityType = null;
    this.options[EntitiesTypes.NODES].checked = false;
    this.options[EntitiesTypes.EDGES].checked = false;
    this.nextButton.disabled = true;
  }

  updateRadioButton(value: EntitiesTypes) {
    this.options[EntitiesTypes.NODES].checked = value === EntitiesTypes.NODES;
    this.options[EntitiesTypes.EDGES].checked = value === EntitiesTypes.EDGES;
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
