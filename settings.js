var request = require( 'request' );

//. Redis
exports.redis_server = '';
exports.redis_port = 6379;

//. IBM App ID
exports.region = 'us-south';
exports.tenantId = '';
exports.apiKey = '';
exports.secret = '';
exports.clientId = '';

exports.redirectUri = 'http://localhost:8080/appid/callback';

exports.oauthServerUrl = 'https://' + exports.region + '.appid.cloud.ibm.com/oauth/v4/' + exports.tenantId;

exports.getAccessToken = async function(){
  return new Promise( async ( resolve, reject ) => {
    //. GET an IAM token
    //. https://cloud.ibm.com/docs/appid?topic=appid-manging-api&locale=ja
    var headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    };
    var option = {
      url: 'https://iam.cloud.ibm.com/oidc/token',
      method: 'POST',
      body: 'grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=' + exports.apiKey,
      headers: headers
    };
    request( option, ( err, res, body ) => {
      if( err ){
        console.log( err );
        resolve( null );
      }else{
        body = JSON.parse( body );
        var access_token = body.access_token;
        resolve( access_token );
      }
    });
  });
}
