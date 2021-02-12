import { startWaiting, stopWaiting } from "../utils";

/**
 * All logic related to the first card (uploading .csv file)
 */
export class CSVUploader {
  private container!: HTMLElement;
  private fileInput!: HTMLInputElement;
  private fileName!: HTMLElement;
  private fileError!: HTMLElement;

  init() {
    this.container = document.getElementById(
      "homeContainer"
    ) as HTMLElement;
    this.fileInput = document.getElementById("importFile") as HTMLInputElement;
    this.fileName = document.getElementById("fileName") as HTMLElement;
    this.fileError = document.getElementById("fileError") as HTMLElement;
    this.hideError();
    this.cleanState();
    this.showCard();
  }

  /**
   * Delete session storage and file uploaded to begin to upload
   */
  private cleanState() {
    if (this.fileInput && this.fileInput.files) {
      this.fileInput.value = "";
    }
    this.fileName.innerText = " ";
    sessionStorage.removeItem("sourceKey");
    sessionStorage.removeItem("rows");
    sessionStorage.removeItem("headers");
    sessionStorage.removeItem("entityName");
  }

  /**
   * Show file name when user added a file
   */
  showFile() {
    const files = this.fileInput?.files;
    this.hideError();
    if (files && files.length) {
      this.fileName.innerText = files[0].name;
      sessionStorage.setItem("entityName", files[0].name.replace(".csv", ""));
    }
  }

  /**
   * Read and save to session storage the file data
   */
  readFile() {
    const params = new URLSearchParams(window.location.search);
    const sourceKey = params.get("sourceKey");
    if (!sourceKey) {
      this.fileError.innerHTML = "No source key defined in URL";
      this.showError();
      throw Error("No source key defined in URL");
    }
    sessionStorage.setItem("sourceKey", sourceKey);

    const files = this.fileInput?.files;
    if (!files || !files.length || !files[0].name.endsWith(".csv")) {
      this.fileError.innerHTML = "Select a valid file";
      this.showError();
      throw Error("Select a valid file");
    }
    startWaiting();
    let fr = new FileReader();
    fr.onload = (event) => {
      stopWaiting();
      if (event && event.target && event.target.result) {
        const result = event.target.result as string;
        // this regex identifies all new line characters (independantly of the OS: windows or unix)
        // then it creates an array of string (each line is an element of the array)
        const rows = result.split(/\r?\n|\r/);
        const headers = rows.shift();
        const rowsStringify = JSON.stringify(rows);
        sessionStorage.setItem("rows", rowsStringify);
        sessionStorage.setItem("headers", headers || "");
        this.hideCard();
      }
    };
    fr.readAsText(files[0]);
  }

  /**
   * Hide eror message
   */
  hideError() {
    this.fileName.style.display = "block";
    this.fileError.style.display = "none";
  }

  /**
   * Show error message
   */
  showError() {
    this.fileName.style.display = "none";
    this.fileError.style.display = "block";
  }

  hideCard() {
    this.container.style.display = "none";
  }

  showCard() {
    this.container.style.display = "block";
  }
}
