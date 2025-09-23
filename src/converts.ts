function mapType(csharpType: string): string {
  switch (csharpType.replace("?", "")) {
    case "int":
    case "decimal":
    case "double":
      return "number";
    case "bool":
      return "boolean";
    case "string":
      return "string";
    case "DateTime":
      return "Date";
    default:
      return "any";
  }
}

export function convertCSharpToMapper(csharpCode: string): string {
  // pega nome da classe
  const classMatch = csharpCode.match(/class\s+(\w+)/);
  const className = classMatch
    ? classMatch[1].replace("Modelo", "")
    : "MyModel";

  const propRegex = /(\[.*?\])?\s*public\s+([\w?<>]+)\s+(\w+)\s*\{.*?\}/g;
  const props = [...csharpCode.matchAll(propRegex)];

  const fieldMapping: string[] = [];
  const tsProps: string[] = [];

  props.forEach(([fullMatch, attribute, type, name]) => {
    const lower = name.charAt(0).toLowerCase() + name.slice(1);
    const decorators: string[] = [];

    if (attribute?.includes("Obrigatorio = true"))
      decorators.push("@Required()");
    const maxLengthMatch = attribute?.match(/CaracteresPermitidos\s*=\s*(\d+)/);
    if (maxLengthMatch) decorators.push(`@MaxLength(${maxLengthMatch[1]})`);

    const decoratorStr =
      decorators.length > 0 ? decorators.join("\n") + "\n" : "";

    // select2: combina Id e Nome
    if (name.endsWith("Id") || name.endsWith("Nome")) {
      const entity = lower.replace(/Id$|Nome$/, "");
      if (!fieldMapping.some((f) => f.includes(entity))) {
        fieldMapping.push(
          `    '${entity}.id': '${name.replace(/Id$|Nome$/, "")}Id',`
        );
        fieldMapping.push(
          `    '${entity}.name': '${name.replace(/Id$|Nome$/, "")}Nome',`
        );
        tsProps.push(`${decoratorStr}  ${entity}?: select2;`);
      }
    } else {
      fieldMapping.push(`    ${lower}: '${name}',`);
      tsProps.push(`${decoratorStr}  ${lower}?: ${mapType(type)};`);
    }
  });

  return `
const { Mapper } = require('@/common/core/models/base');
const { AnyObject } = require('@/common/core/types/any-object');
const { select2 } = require('@/common/core/types/select2');
const { Required } = require('@/common/helpers/class-validator/required');
const { MaxLength } = require('@/common/helpers/class-validator/max-length');

class ${className} extends Mapper {
  fieldMappingKeys = {
${fieldMapping.join("\n")}
  };

${tsProps.join("\n")}

  constructor(json) {
    super();
    this.map(json);
  }
}

module.exports = { convertCSharpToMapper };
`;
}

module.exports = { convertCSharpToMapper };
