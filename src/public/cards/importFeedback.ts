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
    let item = isEdge ? 'edge' : 'node';
    let errors = '';
    Object.entries(feedback.error || {}).forEach(([key, value], index) => {
      const jumpLine = Object.entries(feedback.error || {}).length === index + 1 ? '.' : ' \n\n';
      errors += key + '\n' + `${value.length === 1 && !value[0].includes('~') ? 'Row' : 'Rows'}: ${value.join(', ')}${jumpLine}`;
    });
    switch (total) {
      case feedback.success: {
        item += total > 1 ? 's' : '';
        const article = total > 1 ? 'them' : 'it';
        this.fillImportFeedback(
          `All ${total} ${item} have been imported. Please index the data-source to make ${article} searchable`,
          'Import successful',
          'success'
        )
        break;
      }
      case feedback.failed: {
        this.fillImportFeedback(
          'Nothing has been imported',
          'Import failed',
          'failed',
          errors
        )
        break;
      }
      default : {
        const failedPlural = feedback.failed! > 1 ? 's' : '';
        const error = 'error' + failedPlural;
        const failedItem = item + failedPlural;
        const successArticle = feedback.success > 1 ? 'them' : 'it';
        const successItem = item + (feedback.success > 1 ? 's' : '');
        this.fillImportFeedback(
          `Only ${feedback.success}/${total} ${successItem} have been imported. Please index the data-source to make ${successArticle} searchable.<br><br>` +
          `While ${feedback.failed}/${total} ${failedItem} have <i>not</i> been imported due to the following ${error}`,
          'Import incomplete',
          'incomplete',
          errors,
          `Please only re-upload only the failed row${failedPlural} when retrying.`
        );

        break;
      }
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
