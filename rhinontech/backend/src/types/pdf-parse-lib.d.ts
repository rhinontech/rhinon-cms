// The package root runs a debug harness on import; services import the library
// file directly, which @types/pdf-parse does not declare.
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdfParse from "pdf-parse";
  export default pdfParse;
}
