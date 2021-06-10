import {startWaiting, stopWaiting} from "../utils";

const FILE_SIZE_LIMIT = 2 * Math.pow(10, 6);

/**
 * All logic related to the first card (uploading .csv file)
 */
export class CSVUploader {
  private container!: HTMLElement;
  private fileInput!: HTMLInputElement;
  private fileName!: HTMLElement;
  private fileSizeLimit!: HTMLElement;
  private fileError!: HTMLElement;
  private readButton!: HTMLButtonElement;
  private _entityName!: string;


  init() {
    this.container = document.getElementById(
      "homeContainer"
    ) as HTMLElement;
    this.fileInput = document.getElementById("importFile") as HTMLInputElement;
    this.readButton = document.getElementById("readButton") as HTMLButtonElement;
    this.fileName = document.getElementById("fileName") as HTMLElement;
    this.fileSizeLimit = document.getElementById("fileSize") as HTMLElement;
    this.fileError = document.getElementById("fileError") as HTMLElement;
    this.hideError();
    this.cleanState();
    this.showCard();
  }

  /**
   * clean the state
   */
  private cleanState() {
    if (this.fileInput && this.fileInput.files) {
      this.fileInput.value = "";
    }
    this.fileName.innerText = " ";
  }

  /**
   * Show file name when user added a file
   */
  showFile() {
    const files = this.fileInput?.files;
    this.hideError();
    if (files && files.length) {
      this.fileName.innerText = files[0].name;
      this.fileName.style.display = 'block';
      this._entityName = files[0].name.replace(".csv", "");
      this.fileSizeLimit.style.display = "none";
      if (!files[0].name.endsWith(".csv")) {
        this.fileError.innerHTML = "Select a valid file";
        this.showError();
        throw Error("Select a valid file");
      } else if (files[0].size > FILE_SIZE_LIMIT) {
        this.fileError.innerHTML = 'File exceeds the 3.5MB limit\n';
        this.showError();
        throw Error('File exceeds the 3.5MB limit\n');
      } else {
        this.readButton.disabled = false;
      }
    }
  }

  /**
   * Read and save the csv file
   */
  readFile(): Promise<{
    sourceKey: string,
    propertiesName: string,
    entityName: string,
    csv: string
  }> {
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams(window.location.search);
      const sourceKey = params.get("sourceKey");
      if (!sourceKey) {
        this.fileError.innerHTML = "No source key defined in URL";
        this.showError();
        reject("No source key defined in URL");
        return;
      }

      const files = this.fileInput?.files;
      if (files && files.length) {
        startWaiting();
        let fr = new FileReader();
        fr.onload = (event) => {
          stopWaiting();
          if (event && event.target && event.target.result) {
            const result = event.target.result as string;
            // this regex identifies all new line characters (independently of the OS: windows or unix)
            // then it extracts the first line (csv headers)
            const headers = result.split(/\r?\n|\r/, 1)[0];
            resolve({
              sourceKey: sourceKey,
              propertiesName: headers,
              entityName: this._entityName,
              csv: result
            });
            this.hideCard();
          }
        };
        fr.readAsText(files[0]);
      }
    })

  }

  /**
   * Hide error message
   */
  hideError() {
    this.fileName.style.display = "block";
    this.fileError.style.display = "none";
  }

  /**
   * Show error message
   */
  showError() {
    this.fileSizeLimit.style.display = "none";
    this.fileError.style.display = "block";
  }

  hideCard() {
    this.container.style.display = "none";
  }

  showCard(fromPrevious?: boolean) {
    if (!fromPrevious) {
      this.fileName.style.display = 'none';
    }
    this.container.style.display = "block";
    this.readButton.disabled = true;
  }
}
