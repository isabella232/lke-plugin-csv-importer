import { CategoriesMapping } from "../models";
import * as utils from "../utils";

/**
 * Class that handles all logic related to the edge mapping card
 * This is the card where the user pick the source and destination categories
 */
export class CSVEdgeMapping {
  private container!: HTMLElement;
  // Source and destination node category inputs
  private inputs!: HTMLCollectionOf<HTMLInputElement>;
  private importButton!: HTMLButtonElement;

  init() {
    this.container = document.getElementById(
      "edgeMappingContainer"
    ) as HTMLElement;
    this.inputs = this.container.getElementsByClassName(
      "mapInput"
    ) as HTMLCollectionOf<HTMLInputElement>;
    this.importButton = this.container.getElementsByClassName(
      "primaryButton"
    )[0] as HTMLButtonElement;
    this.importButton.disabled = true;
    this.hideCard();

    this.inputs[0].value = "";
    this.inputs[1].value = "";
    this.inputs[0].addEventListener("input", this.onChangeInput.bind(this));
    this.inputs[1].addEventListener("input", this.onChangeInput.bind(this));
  }

  onChangeInput() {
    this.importButton.disabled = !(
      this.inputs[0].value && this.inputs[1].value
    );
  }

  /**
   * Using data in session storage, import it and return message of success
   */
  async importEdges(categoriesMapping: CategoriesMapping): Promise<string> {
    utils.startWaiting();
    try {

      const resNodes = await utils.makeRequest(
        "POST",
        'api/importEdges',
        {
          sourceKey: sessionStorage.getItem('sourceKey'),
          entityType: sessionStorage.getItem('entityName'),
          csv: sessionStorage.getItem('csv'),
          sourceType: categoriesMapping.source,
          destinationType: categoriesMapping.destination
        }
      );
      const data = JSON.parse(resNodes.response);
      return `${data.success}/${data.total} edges have been added to the database`;
    } catch (error) {
      throw new Error("Import has failed");
    } finally {
      utils.stopWaiting();
    }
  }

  async importAndFeedback(): Promise<string> {
    const feedback = await this.importEdges({
      source: this.inputs[0].value,
      destination: this.inputs[1].value,
    });
    this.hideCard();
    return feedback;
  }

  hideCard() {
    this.container.style.display = "none";
  }

  showCard() {
    this.container.style.display = "block";
  }
}
