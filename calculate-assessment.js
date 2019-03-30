'use strict'

const http = require('http');
const fs = require('fs');
const cheerio = require('cheerio');
const yaml = require('js-yaml');
const assessmentCalculation = require('./assessment-calculation')

try {
  // Get document, or throw exception on error
  var doc = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));
  // console.log(doc);
}
catch (e) {
  console.log(e);
}

exports.handler = function(event, context, callback) {
  if (event.httpMethod == 'OPTIONS') {
    callback(null, {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
      },
      body: JSON.stringify({})
    });
  }

  else {
    var body = JSON.parse(event.body);
    var URL = 'http://apps01.lakecountyil.gov/spassessor/comparables/PTAIComp.aspx?grid=S&pin=' + body.subjectPin +
      '&cmp1pin=' + body.comparable1Pin +
      '&cmp2pin=' + body.comparable2Pin +
      '&cmp3pin=' + body.comparable3Pin;

    return http.get(URL, (resp) => {
      let data = '';

        // A chunk of data has been recieved.

      resp.on('data', (chunk) => {   data += chunk;  });

        // The whole response has been received. Print out the result.

      resp.on('end', () => {
        const $ = cheerio.load(data);

        var originalValues = {};
        var adjustedValues = {};
        $('#grid tr').each(function(i, elem) {
          var key = $(this).find('th').text().replace(/\n/g, "").trim();
          var value = [];
          $(this).children('td').each(function(i, elem) {
            value.push($(this).text().replace(/\n/g, "").trim());
          });
          originalValues[key] = value;
        });

        originalValues['Sketches'] = [
          $('#SubjectThumb1').attr('src'),
          $('#CompThumb1').attr('src'),
          $('#CompThumb2').attr('src'),
          $('#CompThumb3').attr('src')
        ];

        // if override provided, use that
        var subjectSQFTValue = 0;
        if (body.sqftValueOverride !== '' && body.sqftValueOverride !== undefined) {
          subjectSQFTValue = parseInt(body.sqftValueOverride);
        }
        else {
          subjectSQFTValue = doc['neighborhood_codes'][originalValues['Neighborhood Number'][0]];
        }

        if (body.subjectLastSaleAmount !== '') {
          originalValues['Last Sale Amount'][0] = body.subjectLastSaleAmount;
        }
        if (body.cmp1LastSaleAmount !== '') {
          originalValues['Last Sale Amount'][1] = body.cmp1LastSaleAmount;
        }
        if (body.cmp2LastSaleAmount !== '') {
          originalValues['Last Sale Amount'][2] = body.cmp2LastSaleAmount;
        }
        if (body.cmp3LastSaleAmount !== '') {
          originalValues['Last Sale Amount'][3] = body.cmp3LastSaleAmount;
        }

        if (body.subjectDateOfSale !== '') {
          originalValues['Date of Sale'][0] = body.subjectDateOfSale;
        }
        if (body.cmp1DateOfSale !== '') {
          originalValues['Date of Sale'][1] = body.cmp1DateOfSale;
        }
        if (body.cmp2ateOfSale !== '') {
          originalValues['Date of Sale'][2] = body.cmp2DateOfSale;
        }
        if (body.cmp3DateOfSale !== '') {
          originalValues['Date of Sale'][3] = body.cmp3DateOfSale;
        }

        for (const key of Object.keys(originalValues)) {
          adjustedValues = assessmentCalculation.DetermineKeyAndPerformAdjustment(
            originalValues, adjustedValues, subjectSQFTValue, key, doc);
        };

        callback(null, {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
          },
          body: JSON.stringify({ originalValues: originalValues, adjustedValues: adjustedValues })
        });
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
  }
}
