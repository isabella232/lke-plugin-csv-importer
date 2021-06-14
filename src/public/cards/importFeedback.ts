import {ImportItemsResponse} from "../../@types/shared";

/**
 * Class that handles all logic for the last card
 * This is the card providing feedback to the user after importing
 */
export class CSVImportFeedback {
  private container!: HTMLElement;
  private importFeedback!: HTMLElement;
  private importStatus!: HTMLElement;
  private importError!: HTMLElement;
  private importErrorHelp!: HTMLElement;

  init() {
    this.container = document.getElementById("nextstep") as HTMLElement;
    this.importStatus = document.getElementById("importDataStatus") as HTMLElement;
    this.importError = document.getElementById("importError") as HTMLElement;
    this.importErrorHelp = document.getElementById("importErrorHelp") as HTMLElement;
    this.importError.style.display = 'none';
    this.importErrorHelp.style.display = 'none';
    this.importFeedback = document.getElementsByClassName(
      "importFeedback"
    )[0] as HTMLElement;
    this.hideCard();
  }

  setFeedback(feedback: ImportItemsResponse, isEdge?: boolean) {
    const total = feedback.success + (feedback.failed ? feedback.failed : 0);
    const item = isEdge ? 'edges' : 'nodes';
    let errors = '';
    Object.entries(feedback.error || {}).forEach(([key, value]) => {
      errors += key + '\n' + `${value.length === 1 ? 'Row' : 'Rows'}: ${value.join(', ')} \n\n`;
    });
    switch (total) {
      case feedback.success:
        this.importFeedback.innerText = `All ${total} ${item} have been imported`;
        this.importStatus.innerText = 'Import successful';
        this.importStatus.classList.add('success');
        break;
      case feedback.failed:
        this.importFeedback.innerText = `Nothing has been imported`;

        this.importStatus.innerText = 'Import failed';
        this.importStatus.classList.add('failed');

        this.importError.style.display = 'block';
        this.importError.innerText = errors;

        break;
      default :
        const error = feedback.failed === 1 ? 'error' : 'errors';

        this.importFeedback.innerText = `${feedback.failed}/${total} ${item} have not been imported due to the following ${error}`;

        this.importStatus.innerText = 'Import incomplete';
        this.importStatus.classList.add('incomplete');

        this.importErrorHelp.style.display = 'block';
        this.importErrorHelp.style.display = `Re-upload only the failed ${feedback.failed === 1 ? 'row' : 'rows'}`;
        this.importErrorHelp.innerText = 'Import incomplete';

        this.importError.innerText = errors;
        this.importError.style.display = 'block';

        break;
    }

  }

  hideCard() {
    this.container.style.display = "none";
    this.importError.style.display = 'none';
    this.importError.style.display = 'none';
  }

  showCard(importResponse: ImportItemsResponse, isEdge?: boolean) {
    this.setFeedback(importResponse, isEdge);
    this.container.style.display = "block";
  }
}
