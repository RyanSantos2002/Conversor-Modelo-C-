export function convertCSharpToMapper(csharpCode: string): string {
  const classMatch = csharpCode.match(/class\s+(\w+)/);
  const className = classMatch
    ? classMatch[1].replace("Modelo", "")
    : "MyModel";

  const propRegex = /(\[.*?\])?\s*public\s+([\w?<>]+)\s+(\w+)\s*\{.*?\}/g;
  const props = [...csharpCode.matchAll(propRegex)];

  const select2Fields: string[] = [];
  const normalFields: string[] = [];
  const select2Props: string[] = [];
  const normalProps: string[] = [];

  // Helper function to map C# types to TypeScript types
  function mapType(type: string): string {
    switch (type.replace("?", "")) {
      case "int":
      case "long":
      case "double":
      case "float":
      case "decimal":
        return "number";
      case "string":
        return "string";
      case "bool":
        return "boolean";
      case "DateTime":
        return "Date";
      case "Guid":
        return "string";
      default:
        return "any";
    }
  }

  props.forEach(([fullMatch, attribute, type, name]) => {
    const lower = name.charAt(0).toLowerCase() + name.slice(1);
    const decorators: string[] = [];

    if (attribute?.includes("Obrigatorio = true"))
      decorators.push("@Required()");
    const maxLengthMatch = attribute?.match(/CaracteresPermitidos\s*=\s*(\d+)/);
    if (maxLengthMatch) decorators.push(`@MaxLength(${maxLengthMatch[1]})`);

    const decoratorStr =
      decorators.length > 0 ? decorators.join("\n") + "\n" : "";

    // Campos select2
    if (name.endsWith("Id") || name.endsWith("Nome")) {
      const entity = lower.replace(/Id$|Nome$/, "");
      if (!select2Fields.some((f) => f.includes(entity))) {
        select2Fields.push(
          `    '${entity}.id': '${name.replace(/Id$|Nome$/, "")}Id',`
        );
        select2Fields.push(
          `    '${entity}.name': '${name.replace(/Id$|Nome$/, "")}Nome',`
        );
        select2Props.push(`${decoratorStr}  ${entity}?: select2;`);
      }
    } else {
      normalFields.push(`    ${lower}: '${name}',`);
      normalProps.push(`${decoratorStr}  ${lower}?: ${mapType(type)};`);
    }
  });

  // Junta select2 primeiro e depois os demais
  const fieldMapping = [...select2Fields, ...normalFields];
  const tsProps = [...select2Props, ...normalProps];

  return `
import { Mapper } from '../base';
import { AnyObject } from '../../types/any-object';
import { select2 } from '../../types/select2';
import { Required } from '@/common/helpers/class-validator/required';
import { MaxLength } from '@/common/helpers/class-validator/max-length';

export class ${className} extends Mapper {
  fieldMappingKeys = {
${fieldMapping.join("\n")}
  };

${tsProps.join("\n")}

  constructor(json?: AnyObject) {
    super();
    this.map(json);
  }
}
`;
}
