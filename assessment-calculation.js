'use strict'

function DetermineKeyAndPerformAdjustment(originalValues, adjustedValues, subjectSQFTValue, key, doc) {
  switch (key) {
    case 'Total Above Ground Living Area (AGLA)':
      adjustedValues[key] = standardAdjustmentForComparablesWithSQFTValue(
        originalValues[key].map(x => convertStringToNumber(x)), subjectSQFTValue);
      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Fireplaces':
      adjustedValues[key] = standardAdjustmentForComparablesWithSQFTValue(
        originalValues[key].map(x => convertStringToNumber(x)), doc['fireplaces'][subjectSQFTValue]);
      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Basement Area / Finished Area':
      var numberOfSubKeys = key.split('/').length;
      var sqftValues = [ doc['basement_area'], doc['finished_area'] ];

      adjustedValues[key] = standardAdjustmentOnSplitValuesWithSQFTValues(originalValues[key], numberOfSubKeys, sqftValues);
      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Lower Level Area / Finished Area':
      var numberOfSubKeys = key.split('/').length;
      var sqftValues = [ doc['lower_level_area'][subjectSQFTValue], doc['finished_area'] ];

      adjustedValues[key] = standardAdjustmentOnSplitValuesWithSQFTValues(originalValues[key], numberOfSubKeys, sqftValues);
      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Land Market Value':
      adjustedValues[key] = standardAdjustmentForComparables(
        originalValues[key].map(x => convertMoneyToNumber(x)));
      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Decks / Patio Area':
      var numberOfSubKeys = key.split('/').length;
      var sqftValues = [ doc['decks'], doc['patio'] ];

      adjustedValues[key] = standardAdjustmentOnSplitValuesWithSQFTValues(originalValues[key], numberOfSubKeys, sqftValues);

      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Full Baths / Half Baths / Total Fixtures':
      adjustedValues[key] = standardAdjustmentForComparablesWithSQFTValue(
        originalValues[key].map(x => convertStringToNumber(x.split('/')[2])), 
        doc['bath_fixtures'][subjectSQFTValue]);

      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Air Conditioning':
      adjustedValues[key] = ynWithSQFTValue(
        originalValues[key], doc['air_conditioning'][subjectSQFTValue]);
      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Fireplaces':
      adjustedValues[key] = standardAdjustmentForComparablesWithSQFTValue(
        originalValues[key].map(x => convertStringToNumber(x)), 
        doc['fireplaces'][subjectSQFTValue]);
      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Year Built / Effective Age':
      adjustedValues[key] = ageWithSQFTValue(
        originalValues[key].map(x => convertStringToNumber(x.split('/')[1])), 
        doc['age'][subjectSQFTValue]);
      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Porches Open / Enclosed Area':
      var numberOfSubKeys = key.split('/').length;
      var sqftValues = [ doc['porches_open'], doc['porches_enclosed'] ];

      adjustedValues[key] = standardAdjustmentOnSplitValuesWithSQFTValues(originalValues[key], numberOfSubKeys, sqftValues);

      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Garage Attached / Detached / Carport Area':
      adjustedValues[key] = standardAdjustmentForComparablesWithSQFTValue(
        originalValues[key].map(x => x.split('/')
          .reduce((accumulator, currentValue, currentIndex, array) => parseInt(accumulator) + parseInt(currentValue) )), 
        doc['garage_area']);
      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Pool (Size)':
      adjustedValues[key] = standardAdjustmentForComparables(
        originalValues[key].map(poolSize => determinePoolCost(parseInt(poolSize))));
      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Gazebo (Size)':
      adjustedValues[key] = standardAdjustmentForComparablesWithSQFTValue(
        originalValues[key].map(gazeboSize => convertStringToNumber(gazeboSize)), doc['gazebos']);
      displayLog(originalValues[key], adjustedValues[key], key);
      break;
    case 'Shed':
      adjustedValues[key] = standardAdjustmentShedWithSQFTValue(
        originalValues[key].map(x => convertStringToNumber(x)), doc['sheds']);
      displayLog(originalValues[key], adjustedValues[key], key);
      break;
  }
  return adjustedValues;
}

function standardAdjustmentOnSplitValuesWithSQFTValues(originalValues, numberOfSubKeys, sqftValues) {
  var adjustedArrays = [];
  for (var i = 0; i < numberOfSubKeys; i++) {
    var original = originalValues.map(x => x.split('/')[i]);
    var adjusted = standardAdjustmentForComparablesWithSQFTValue(original.map(x => convertStringToNumber(x)), sqftValues[i]);
    adjustedArrays.push(adjusted);
  }

  var finalArray = [];
  for (var i = 0; i < adjustedArrays[0].length; i++) {
    var string1 = '';
    for (var j = 0; j < adjustedArrays.length; j++) {
      if (j === 0) {
        string1 = adjustedArrays[j][i]; 
      }
      else {
        string1 = string1 + '/' + adjustedArrays[j][i]; 
      }
    }
    finalArray.push(string1);
  }
  return finalArray;
}

function ageWithSQFTValue(listOfValues, sqftValue) {
  var subjectValue = listOfValues[0];
  var adjustedValues = [];

  for (var i = 1; i < listOfValues.length; i++) {
    var adjustedValue = ageAdjustmentWithSQFTValue(subjectValue, listOfValues[i], sqftValue);
    adjustedValues.push(adjustedValue);
  }
  return adjustedValues;
}

function ageAdjustmentWithSQFTValue(subjectValue, comparableValue, sqftValue) {
  var adjustedValue = 0;
  if ((comparableValue < subjectValue && (subjectValue - comparableValue) >= 5) 
    || (comparableValue > subjectValue && (comparableValue - subjectValue) >= 5))
  {
    var adjustedValue = sqftValue * (subjectValue - comparableValue);
  }

  return adjustedValue;
}

function ynWithSQFTValue(listOfValues, sqftValue) {
  var subjectValue = listOfValues[0];
  var adjustedValues = [];

  for (var i = 1; i < listOfValues.length; i++) {
    var adjustedValue = ynAdjustmentWithSQFTValue(subjectValue, listOfValues[i], sqftValue);
    adjustedValues.push(adjustedValue);
  }

  return adjustedValues;
}

function ynAdjustmentWithSQFTValue(subjectValue, comparableValue, sqftValue) {
  var adjustedValue = 0;
  if (subjectValue === 'Y' && comparableValue === 'N')
  {
    var adjustedValue = sqftValue;
  }
  else if (subjectValue === 'N' && comparableValue === 'Y')
  {
    var adjustedValue = sqftValue * -1;
  }

  return adjustedValue;
}

function standardAdjustmentShedWithSQFTValue(listOfValues, sqftValue) {
  var subjectValue = listOfValues[0];
  var adjustedValues = [];

  var subjectSize = 0;
  if (subjectValue > 1)
  {
    subjectSize = subjectValue;
  }

  for (var i = 1; i < listOfValues.length; i++) {
    var adjustedValue = standardAdjustmentWithSQFTValue(subjectSize, listOfValues[i], sqftValue);
    adjustedValues.push(adjustedValue);
  }

  return adjustedValues;
}

function standardAdjustmentForComparablesWithSQFTValue(listOfValues, sqftValue) {
  var subjectValue = listOfValues[0];
  var adjustedValues = [];

  for (var i = 1; i < listOfValues.length; i++) {
    var adjustedValue = standardAdjustmentWithSQFTValue(subjectValue, listOfValues[i], sqftValue);
    adjustedValues.push(adjustedValue);
  }

  return adjustedValues;
}

function standardAdjustmentForComparables(listOfValues) {
  var subjectValue = listOfValues[0];
  var adjustedValues = [];

  for (var i = 1; i < listOfValues.length; i++) {
    var adjustedValue = standardAdjustment(subjectValue , listOfValues[i]);
    adjustedValues.push(adjustedValue);
  }

  return adjustedValues;
}

function standardAdjustment(subjectValue, comparableValue) {
  return (subjectValue - comparableValue);
}

function standardAdjustmentWithSQFTValue(subjectValue, comparableValue, sqftValue) {
  return (sqftValue * (subjectValue - comparableValue));
}

function convertMoneyToNumber(x) { 
  return parseInt(x.replace(/[^\d-]/g, ''));
}

function convertStringToNumber(x) { 
  if (x)
  {
    return parseInt(x);
  }
  else {
    return 0;
  }
}

function determinePoolCost(poolSize) 
{
  if (poolSize > 0 && poolSize <= 799) {
    return 5000;
  }
  else if (poolSize >= 800 && poolSize <= 1999) {
    return 10000;
  }
  else if (poolSize >= 2000) {
    return 20000;
  }
  else {
    return 0;
  }
}

function displayLog(originalValues, adjustedValues, key) {
  // console.log(key);
  // console.log(originalValues); 
  // console.log(adjustedValues);
}

module.exports = {
    standardAdjustmentForComparables: standardAdjustmentForComparables,
    standardAdjustmentForComparablesWithSQFTValue: standardAdjustmentForComparablesWithSQFTValue,
    standardAdjustmentShedWithSQFTValue: standardAdjustmentShedWithSQFTValue,
    ynWithSQFTValue: ynWithSQFTValue,
    ageWithSQFTValue: ageWithSQFTValue,
    standardAdjustmentOnSplitValuesWithSQFTValues: standardAdjustmentOnSplitValuesWithSQFTValues,
    DetermineKeyAndPerformAdjustment: DetermineKeyAndPerformAdjustment
};