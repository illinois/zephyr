const { promisify } = require('util');
const xml2js = promisify(require('xml2js').parseString);
const validator = require('validator');

function formatExpression(json) {
  const original = json[0]['Original'][0].trim();
  const expanded = json[0]['Expanded'][0].trim();

  return `Original: ${original}\n` + `Expanded: ${expanded}`;
}


function processCatchResult(result) {
  const xml = result.stdout;
  let catchJSON;
  try {
    catchJSON = xml2js(xml);
  } catch (e) {
    return {
      name: result.name,
      success: false,
      weight: result.tags.weight,
      earned: 0,
      output: 'Error: Unable to read buffer.'
    };
  }

  if (!catchJSON['Catch']['Group'][0]['TestCase']) {
    return {
      name: result.name,
      success: false,
      weight: result.tags.weight,
      earned: 0,
      output: 'Error: No `catch` TestCase found.'
    };
  }

  // Find success/failure
  const success = validator.toBoolean(catchJSON['Catch']['Group'][0]['TestCase'][0]['OverallResult'][0]['$']['success']);
  let output = '';
  if (!success) {
    if (catchJSON['Catch']['Group'][0]['TestCase'][0]['FatalErrorCondition']) {
      const error = catchJSON['Catch']['Group'][0]['TestCase'][0]['FatalErrorCondition'][0]['_'].trim();
      output = `Fatal Error: ${  error}`;
    } else if ( catchJSON['Catch']['Group'][0]['TestCase'][0]['Exception'] ) {
      const error = catchJSON['Catch']['Group'][0]['TestCase'][0]['Exception'][0]['_'].trim();
      output = `Exception: ${  error}`;
    } else if ( catchJSON['Catch']['Group'][0]['TestCase'][0]['Failure'] ) {
      const error = catchJSON['Catch']['Group'][0]['TestCase'][0]['Failure'][0]['_'].trim();
      output = `FAIL: ${  error}`;
    } else if (catchJSON['Catch']['Group'][0]['TestCase'][0]['Section']) {
      catchJSON['Catch']['Group'][0]['TestCase'][0]['Section'].forEach(section => {
        if (section['Expression']) {
          output += formatExpression(section['Expression']);
          output += '\n';
        }
      });
    } else {
      //console.log( catchJSON['Catch']['Group'][0]['TestCase'][0]['Expression'][0] );
      try {
        output = formatExpression( catchJSON['Catch']['Group'][0]['TestCase'][0]['Expression'] );
      } catch (e) {
        output = catchJSON['Catch']['Group'][0]['TestCase'];
        console.log(' UNKNWON CATCH OUTPUT: ');
        console.log(output);
      }
    }
  }

  // Complete test case
  return {
    name: result.tags.name,
    tags: result.tags,
    success: success,
    weight: result.tags.weight,
    earned: (success) ? result.tags.weight : 0,
    output: output,
  };
}

module.exports = processCatchResult;
