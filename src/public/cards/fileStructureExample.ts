import {EntityType} from "@linkurious/rest-client";

/**
 * All logic related to csv file structure example
 */
export class CSVFileStructureExample {
  private container!: HTMLElement;
  private exampleImage!: HTMLImageElement;
  private showEdgesButton!: HTMLElement;
  private showNodesButton!: HTMLElement;

  init() {
    this.container = document.getElementById(
      "fileStructureExampleContainer"
    ) as HTMLElement;
    this.exampleImage = document.getElementById("exampleImage") as HTMLImageElement;
    this.showEdgesButton = document.getElementById("showEdgeExampleButton") as HTMLImageElement;
    this.showNodesButton = document.getElementById("showNodeExampleButton") as HTMLImageElement;
    this.hideCard();
  }

  hideCard() {
    this.container.style.display = "none";
    this.showNodesButton.classList.remove('under-line');
    this.showEdgesButton.classList.remove('under-line');
  }

  showCard() {
    this.container.style.display = "block";
    this.showNodesButton.classList.add('under-line')
  }

  showImageExample(type: EntityType) {
    if (type === EntityType.EDGE) {
      this.showEdgesButton.classList.add('under-line');
      this.showNodesButton.classList.remove('under-line');
    } else {
      this.showNodesButton.classList.add('under-line');
      this.showEdgesButton.classList.remove('under-line');
    }
    this.exampleImage.setAttribute('src', `./assets/img/${type}.png`);

  }
}
