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
      const rows = sessionStorage.getItem("rows");
      const headers = sessionStorage.getItem("headers");
      const edgeType = sessionStorage.getItem("entityName");
      if (rows && headers && edgeType) {
        const rowsParsed = JSON.parse(rows);
        const headersParsed = headers.split(",");
        const queryTemplate = this.createEdgeTemplate(
          categoriesMapping,
          edgeType,
          headersParsed
        );
        const edges = this.createQueries(queryTemplate, rowsParsed);
        const resNodes = await utils.makeRequest(
          "POST",
          `api/addEdges?sourceKey=${sessionStorage.getItem("sourceKey")}`,
          {
            edges: edges,
          }
        );
        const data = JSON.parse(resNodes.response);
        return `${data.success}/${data.total} edges have been added to the database`;
      }
      return "";
    } catch (error) {
      throw new Error("Import has failed");
    } finally {
      utils.stopWaiting();
    }
  }

  /**
   * From the edge config create query templates
   */
  private createEdgeTemplate(
    categories: CategoriesMapping,
    edgeType: string,
    edgeProperties: string[]
  ): string {
    const fromNode = `uid = ~0~ `;
    let fromQuery = `MATCH (f:${categories.source}) WHERE f.${fromNode}`;

    const toNode = `uid = ~1~ `;
    let toQuery = `MATCH (t:${categories.destination}) WHERE t.${toNode}`;

    const edgePropertiesQuery = edgeProperties
      .slice(2)
      .map((property, index) => {
        return `SET e.${property} = ~${index + 2}~`;
      })
      .join(" ");
    let edgeQuery = `MERGE (f)-[e:${edgeType}]->(t) ${edgePropertiesQuery} RETURN 1`;

    return fromQuery + toQuery + edgeQuery;
  }

  /**
   * Using query templates and data from the csv file, return a list of queries to be ran
   */
  private createQueries(queryTemplate: string, csv: string[]): string[] {
    let res = [];

    for (let l = 0; l < csv.length; l++) {
      let qt = queryTemplate;
      let line = csv[l].split(",");
      for (let p = 0; p < line.length; p++) {
        let par = line[p];
        if (par != "") {
          if (
            (par.startsWith('"') && par.endsWith('"')) ||
            (par.startsWith("'") && par.endsWith("'"))
          ) {
            par = par.slice(1, -1);
          }
          par = par.replace('"', '\\"');
          qt = qt.replace(new RegExp("~" + p + "~", "g"), '"' + par + '"');
        } else {
          qt = qt.replace(new RegExp("~" + p + "~", "g"), "null");
        }
      }
      res.push(qt);
    }
    return res;
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
