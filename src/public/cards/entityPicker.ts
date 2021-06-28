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
    this.options[EntitiesTypes.nodes].addEventListener("change", () =>
      this.updateRadioButton(EntitiesTypes.nodes)
    );
    this.options[EntitiesTypes.edges].addEventListener("change", () =>
      this.updateRadioButton(EntitiesTypes.edges)
    );
    this.nextButton = document.getElementById(
      "nextButtonEntity"
    ) as HTMLButtonElement;
    this.cleanState();
    this.hideCard();
  }

  cleanState() {
    this.entityType = null;
    this.options[EntitiesTypes.nodes].checked = false;
    this.options[EntitiesTypes.edges].checked = false;
    this.nextButton.disabled = true;
  }

  updateRadioButton(value: EntitiesTypes) {
    this.options[EntitiesTypes.nodes].checked = value === EntitiesTypes.nodes;
    this.options[EntitiesTypes.edges].checked = value === EntitiesTypes.edges;
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
