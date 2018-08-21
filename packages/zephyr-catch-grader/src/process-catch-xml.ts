import deasync from 'deasync';
import { parseString } from 'xml2js';
const xml2js = deasync(parseString);
import validator from 'validator';

import { ITestCaseResult } from '@illinois/zephyr-grader-base';
import { ICatchTestCaseResult } from './grader';

function formatExpression(json: any) {
  const original = json[0].Original[0].trim();
  const expanded = json[0].Expanded[0].trim();
  return `Original: ${original}\nExpanded: ${expanded}`;
}

export default (result: ICatchTestCaseResult): ITestCaseResult => {
  const xml = result.stdout;
  let catchJSON;
  try {
    catchJSON = xml2js(xml);
  } catch (e) {
    console.error(e);
    return {
      name: result.name,
      tags: result.tags,
      success: false,
      weight: result.tags.weight,
      earned: 0,
      output: 'Error: Unable to read buffer.',
    };
  }

  if (!catchJSON.Catch.Group[0].TestCase) {
    return {
      name: result.name,
      tags: result.tags,
      success: false,
      weight: result.tags.weight,
      earned: 0,
      output: 'Error: No `catch` TestCase found.',
    };
  }

  // Find success/failure
  const success = validator.toBoolean(catchJSON.Catch.Group[0].TestCase[0].OverallResult[0].$.success);
  let output = '';
  if (!success) {
    if (catchJSON.Catch.Group[0].TestCase[0].FatalErrorCondition) {
      const error = catchJSON.Catch.Group[0].TestCase[0].FatalErrorCondition[0]._.trim();
      output = `Fatal Error: ${error}`;
    } else if ( catchJSON.Catch.Group[0].TestCase[0].Exception ) {
      const error = catchJSON.Catch.Group[0].TestCase[0].Exception[0]._.trim();
      output = `Exception: ${error}`;
    } else if ( catchJSON.Catch.Group[0].TestCase[0].Failure ) {
      const error = catchJSON.Catch.Group[0].TestCase[0].Failure[0]._.trim();
      output = `FAIL: ${error}`;
    } else if (catchJSON.Catch.Group[0].TestCase[0].Section) {
      catchJSON.Catch.Group[0].TestCase[0].Section.forEach((section: any) => {
        if (section.Expression) {
          output += formatExpression(section.Expression);
          output += '\n';
        }
      });
    } else {
      // console.log( catchJSON['Catch']['Group'][0]['TestCase'][0]['Expression'][0] );
      try {
        output = formatExpression(catchJSON.Catch.Group[0].TestCase[0].Expression);
      } catch (e) {
        output = catchJSON.Catch.Group[0].TestCase;
      }
    }
  }

  // Complete test case
  return {
    name: result.name,
    tags: result.tags,
    success,
    weight: result.tags.weight,
    earned: (success) ? result.tags.weight : 0,
    output,
  };
};
