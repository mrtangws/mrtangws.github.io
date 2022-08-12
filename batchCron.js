const AWS = require('aws-sdk');
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const move = [[-1,0],[1,0],[0,-1],[0,1]];

async function read(params){
    const data = await ddb.batchGetItem(params).promise()
    return data;
}

async function write(params){
    await ddb.batchWriteItem(params).promise();
    return "write successful";
}

exports.handler = async (event) => {
    //let body = JSON.parse(event.body);
    var message = "dynamo cron: ";
    var params = {
        RequestItems: { // map of TableName to list of Key to get from each table
            'tableOne': {
                Keys: [ // a list of primary key value maps
                    {'id': {S: '666'} },
                    {'id': {S: 'MAX_GRID'} }
                ],
                ProjectionExpression: 'id, x, y'
            }
        }
      };
    try {
      const data = await read(params);
      var xVal, yVal;
      // message = JSON.stringify(data.Responses.tableOne);
      // message = " ";
      data.Responses.tableOne.forEach(function(element, index, array) {
        message += Object.values(element.id);
        if(Object.values(element.id) == "666") {
          xVal = parseInt(Object.values(element.x));
          yVal = parseInt(Object.values(element.y));
        }
      });
      let ran = Math.floor(Math.random() * 4);
      xVal += move[ran][0];
      yVal += move[ran][1];
      message = "x: " + xVal + " y: " + yVal;

      params = {
        RequestItems: {
          'tableOne': [
             {
               PutRequest: {
                 Item: {
                    'id': { 'S': '666' },
                    'x': { 'N': xVal.toString() },
                    'y': { 'N': yVal.toString() }
                 }
               }
             },
          ]
        }
      };
      message = await write(params);

    } catch (err) {
      return { error: err }
    }
    return { body: message}
};
