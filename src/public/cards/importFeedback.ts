import {ImportResult} from "../../@types/shared";

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

  setFeedback(feedback: ImportResult, isEdge?: boolean) {
    this.importStatus.classList.remove('success', 'failed', 'incomplete');
    if ('globalError' in feedback) {
      this.fillImportFeedback(
        'Nothing has been imported',
        'Import failed',
        'failed',
        feedback.globalError
      )
      return;
    }
    const total = feedback.success + (feedback.failed ? feedback.failed : 0);
    const item = isEdge ? 'edges' : 'nodes';
    let errors = '';
    Object.entries(feedback.error || {}).forEach(([key, value], index) => {
      const jumpLine = Object.entries(feedback.error || {}).length === index + 1 ? '.' : ' \n\n';
      errors += key + '\n' + `${value.length === 1 && !value[0].includes('~') ? 'Row' : 'Rows'}: ${value.join(', ')}${jumpLine}`;
    });
    switch (total) {
      case feedback.success:
        this.fillImportFeedback(
          `All ${total} ${item} have been imported`,
          'Import successful',
          'success'
          )
        break;
      case feedback.failed:
        this.fillImportFeedback(
          'Nothing has been imported',
          'Import failed',
          'failed',
          errors
        )
        break;
      default :
        const error = feedback.failed === 1 ? 'error' : 'errors';
        this.fillImportFeedback(
          `${feedback.failed}/${total} ${item} have not been imported due to the following ${error}`,
          'Import incomplete',
          'incomplete',
          errors,
          `Re-upload only the failed ${feedback.failed === 1 ? 'row' : 'rows'}`
        )

        break;
    }

  }

  fillImportFeedback(feedback: string, status: string, _class: string, errors?: string, errorHelp?: string) {
    this.importFeedback.innerText = feedback;
    this.importStatus.innerText = status;
    this.importStatus.classList.add(_class);
    if (errors) {
      this.importError.style.display = 'block';
      this.importError.innerText = errors;
    }
    if (errorHelp) {
      this.importErrorHelp.style.display = 'block';
      this.importErrorHelp.innerText = errorHelp;
    }
  }

  hideCard() {
    this.container.style.display = "none";
    this.importError.style.display = 'none';
    this.importError.style.display = 'none';
  }

  showCard(importResult: ImportResult, isEdge?: boolean) {
    this.setFeedback(importResult, isEdge);
    this.container.style.display = "block";
  }
}
