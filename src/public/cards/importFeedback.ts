/**
 * Class that handles all logic for the last card
 * This is the card providing feedback to the user after importing
 */
export class CSVImportFeedback {
  private container!: HTMLElement;
  private importFeedback!: HTMLElement;

  init() {
    this.container = document.getElementById(
      "nextstep"
    ) as HTMLElement;
    this.importFeedback = document.getElementsByClassName(
      "importFeedback"
    )[0] as HTMLElement;
    this.hideCard();
  }

  setFeedback(feedback: string) {
    this.importFeedback.innerText = feedback;
  }

  hideCard() {
    this.container.style.display = "none";
  }

  showCard(feedback: string) {
    this.setFeedback(feedback);
    this.container.style.display = "block";
  }
}
